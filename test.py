import importlib

def execute_code_and_return_output(code):
    try:
        # Create a dictionary to use as the local and global namespace for execution
        exec_namespace = {}

        # Execute the code within the specified namespace
        exec(code, exec_namespace)

        # Check if the code defines a function named 'main' and execute it if present
        if 'main' in exec_namespace and callable(exec_namespace['main']):
            output = exec_namespace['main']()
            return output
        else:
            return "Code executed successfully."

    except ImportError as import_error:
        # If an ImportError occurs, try to import the missing module dynamically
        module_name = str(import_error).split("No module named ", 1)[-1]
        try:
            importlib.import_module(module_name)
            # Retry code execution after successful import
            return execute_code_and_return_output(code)
        except ImportError:
            return f"Error: Module '{module_name}' not found."

    except Exception as e:
        return f"Error during code execution: {e}"

# Example usage:
code_to_execute = """
import requests
import fernet

def main():
    response = requests.get("https://www.example.com")
    return response.text
"""

result = execute_code_and_return_output(code_to_execute)
print(result)

