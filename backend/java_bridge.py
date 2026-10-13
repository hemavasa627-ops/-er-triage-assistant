"""
Java OOP & ADSA Bridge for ER Triage Assistant.
Manages compilation and subprocess execution of the standalone Java triage module.
Documents inter-process communication between the Python FastAPI backend and the Java engine.
"""

import os
import subprocess
import json
from pathlib import Path
from typing import Dict, Any, Optional, List

JAVA_MODULE_DIR = Path(__file__).resolve().parent.parent / "java-module"
JAVA_SRC_DIR = JAVA_MODULE_DIR / "src"
JAVA_BIN_DIR = JAVA_MODULE_DIR / "bin"

# Candidate paths for JDK
LOCAL_SCRATCH_JDK = Path("C:/Users/hema/.gemini/antigravity/scratch/jdk")

def find_java_executables() -> Dict[str, Optional[str]]:
    """Locates java and javac binaries on the system or in the local scratch JDK directory."""
    java_exe = None
    javac_exe = None

    # Check local scratch JDK directory first
    if LOCAL_SCRATCH_JDK.exists():
        found_javac = list(LOCAL_SCRATCH_JDK.glob("**/bin/javac.exe"))
        found_java = list(LOCAL_SCRATCH_JDK.glob("**/bin/java.exe"))
        if found_javac and found_java:
            return {"javac": str(found_javac[0]), "java": str(found_java[0]), "source": "portable_scratch_jdk"}

    # Check system PATH
    try:
        res = subprocess.run(["javac", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=3)
        if res.returncode == 0:
            javac_exe = "javac"
    except Exception:
        pass

    try:
        res = subprocess.run(["java", "-version"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=3)
        if res.returncode == 0:
            java_exe = "java"
    except Exception:
        pass

    if java_exe and javac_exe:
        return {"javac": javac_exe, "java": java_exe, "source": "system_path"}

    return {"javac": javac_exe, "java": java_exe, "source": "none"}

def compile_java_module() -> Dict[str, Any]:
    """Compiles all Java source files into java-module/bin."""
    execs = find_java_executables()
    javac = execs.get("javac")

    if not javac:
        return {
            "success": False,
            "error": "No javac compiler found in PATH or scratch JDK directory.",
            "executables": execs
        }

    JAVA_BIN_DIR.mkdir(parents=True, exist_ok=True)
    sources = list(JAVA_SRC_DIR.glob("**/*.java"))
    if not sources:
        return {"success": False, "error": f"No .java files found in {JAVA_SRC_DIR}"}

    cmd = [javac, "-d", str(JAVA_BIN_DIR)] + [str(s) for s in sources]
    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=30)
        if proc.returncode == 0:
            return {
                "success": True,
                "message": f"Successfully compiled {len(sources)} Java classes to {JAVA_BIN_DIR}",
                "classes_compiled": [s.stem for s in sources]
            }
        else:
            return {
                "success": False,
                "error": proc.stderr or proc.stdout
            }
    except Exception as e:
        return {"success": False, "error": str(e)}

def run_java_tests() -> Dict[str, Any]:
    """Runs the Java test suite via CLI bridge: java -cp bin er.triage.Main --test."""
    execs = find_java_executables()
    java = execs.get("java")

    if not java:
        return {"success": False, "error": "No java runtime found to execute tests."}

    # Ensure compiled
    compile_java_module()

    cmd = [java, "-cp", str(JAVA_BIN_DIR), "er.triage.Main", "--test"]
    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=15)
        return {
            "success": proc.returncode == 0,
            "return_code": proc.returncode,
            "stdout": proc.stdout,
            "stderr": proc.stderr
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def run_java_demo() -> Dict[str, Any]:
    """Runs the Java demo via CLI bridge: java -cp bin er.triage.Main --demo."""
    execs = find_java_executables()
    java = execs.get("java")

    if not java:
        return {"success": False, "error": "No java runtime found to run demo."}

    compile_java_module()

    cmd = [java, "-cp", str(JAVA_BIN_DIR), "er.triage.Main", "--demo"]
    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=15)
        return {
            "success": proc.returncode == 0,
            "output": proc.stdout,
            "error": proc.stderr
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    print("Java Executables:", find_java_executables())
    print("Compiling Java module:", compile_java_module())
    print("Running Java tests:\n", run_java_tests().get("stdout"))
