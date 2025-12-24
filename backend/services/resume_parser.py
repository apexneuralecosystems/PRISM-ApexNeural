"""Standalone Resume Parser - Extracts structured information from raw resume text and returns JSON according to the required schema."""
import json
import re
from typing import Dict, Any
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
import PyPDF2
import io


class ResumeParser:
    """Parses raw resume text into structured JSON format."""
    
    def __init__(self, model_name: str = "gpt-4o-mini", temperature: float = 0.1):
        self.llm = ChatOpenAI(model=model_name, temperature=temperature)
        self.prompt_template = ChatPromptTemplate.from_messages([
            (
                "system",
                """You are an AI Resume Parser. You will receive raw text extracted from a PDF resume. Your task is to extract all structured information and return only valid JSON according to the schema described below.

Rules & Guidelines:
- Output only JSON — do not include markdown, explanations, or extra text.
- Missing fields must be returned as "info not available in resume".

Education:
Return as a list of objects. Each object must have:
- College: Name of the college/university
- Degree: Degree obtained (B.Tech, M.Tech, MBA, etc.)
- Specialization: Field of study
- Grade: Marks, percentage, or CGPA

School:
Return as a list of strings with all schools attended.

Experience:
Return as a list of objects. Each object must include:
- Company: Company name
- Role: Job title
- Duration: Total work duration (calculate if dates provided, e.g., Jan 2020 – Feb 2023 = 3 years 1 month)
- Description: A short paragraph describing responsibilities, work done, and client names if available

Projects:
Return as a list of objects. Each object must include:
- ProjectName: Name of the project
- TechStack: Technologies used
- Description: Short description of the project

Skills:
Return as a list of technical skills (programming languages, frameworks, tools, databases, cloud platforms, etc.)

Certifications, Activities_Hobbies, Achievements, Languages:
Return as lists of strings.

State, City, Country:
Return State and City where the candidate studied or lives.
If Country is missing, infer from State/City; if not possible, return "info not available in resume".

Name, Number, Email:
Extract full name, phone number, and email address. Return "info not available in resume" if missing.

Output formatting:
- Always return valid JSON.
- Flatten nested data, no extra brackets or markdown.
- Use lists of objects for multi-entry fields (Education, Experience, Projects).
- Use lists of strings for simple multi-entry fields (Schools, Skills, Certifications, Languages, Achievements, Hobbies).

Return ONLY the JSON object with "output" as the root key.""",
            ),
            ("human", "Resume Text:\n{resume_text}"),
        ])

    def extract_text_from_pdf(self, pdf_file: bytes) -> str:
        """Extract text from PDF file bytes."""
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_file))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")

    def parse(self, resume_text: str) -> Dict[str, Any]:
        """
        Parse raw resume text into structured JSON and normalize to the schema.
        Args:
            resume_text: Raw text extracted from resume PDF
        Returns:
            Parsed resume data as a dictionary (value of the 'output' key)
        """
        chain = self.prompt_template | self.llm
        response = chain.invoke({"resume_text": resume_text})
        
        # Extract JSON from response
        content = response.content.strip()
        
        # Remove markdown code fences if present
        if content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1]) if len(lines) > 2 else content
        
        try:
            parsed_data = json.loads(content)
        except json.JSONDecodeError as e:
            # Try to find JSON object in the response
            json_match = re.search(r"\{.*\}", content, re.DOTALL)
            if json_match:
                try:
                    parsed_data = json.loads(json_match.group())
                except json.JSONDecodeError:
                    # Try to fix common JSON issues
                    json_str = json_match.group()
                    # Fix single quotes to double quotes (basic fix)
                    json_str = json_str.replace("'", '"')
                    # Try to extract just the output key if present
                    if '"output"' in json_str or "'output'" in json_str:
                        output_match = re.search(r'["\']output["\']\s*:\s*(\{.*\})', json_str, re.DOTALL)
                        if output_match:
                            try:
                                parsed_data = {"output": json.loads(output_match.group(1))}
                            except:
                                pass
                    try:
                        parsed_data = json.loads(json_str)
                    except json.JSONDecodeError:
                        raise ValueError(f"Failed to parse JSON from LLM response: {str(e)}")
            else:
                raise ValueError(f"Failed to parse JSON from LLM response: {str(e)}")
        
        data = parsed_data.get("output", parsed_data)
        return self._normalize_output(data)

    # ----------------------- normalization helpers ----------------------- #
    
    @staticmethod
    def _dedup_list(items):
        seen = set()
        deduped = []
        for item in items:
            key = json.dumps(item, sort_keys=True) if isinstance(item, (dict, list)) else str(item)
            if key in seen:
                continue
            seen.add(key)
            deduped.append(item)
        return deduped

    def _normalize_output(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure all fields exist, are properly typed, de-duplicated, and have 'info not available in resume' where missing."""
        default_str = "info not available in resume"
        
        # Simple string fields
        result = {
            "Name": data.get("Name", default_str),
            "Number": data.get("Number", default_str),
            "Email": data.get("Email", default_str),
            "State": data.get("State", default_str),
            "City": data.get("City", default_str),
            "Country": data.get("Country", default_str),
        }
        
        # List of strings fields
        list_string_fields = ["School", "Skills", "Certifications", "Activities_Hobbies", "Achievements", "Languages"]
        for field in list_string_fields:
            value = data.get(field, [])
            if not isinstance(value, list):
                value = []
            value = [v for v in value if v and v != default_str]
            value = self._dedup_list(value)
            if not value:
                value = [default_str]
            result[field] = value
        
        # List of object fields with required keys
        def normalize_obj_list(items, keys):
            if not isinstance(items, list):
                items = []
            normalized = []
            for item in items:
                if not isinstance(item, dict):
                    continue
                norm_item = {k: item.get(k, default_str) if item.get(k) else default_str for k in keys}
                normalized.append(norm_item)
            if not normalized:
                normalized = [{k: default_str for k in keys}]
            return self._dedup_list(normalized)
        
        result["Education"] = normalize_obj_list(
            data.get("Education", []),
            ["College", "Degree", "Specialization", "Grade"],
        )
        result["Projects"] = normalize_obj_list(
            data.get("Projects", []),
            ["ProjectName", "TechStack", "Description"],
        )
        result["Experience"] = normalize_obj_list(
            data.get("Experience", []),
            ["Company", "Role", "Duration", "Description"],
        )
        
        return result

