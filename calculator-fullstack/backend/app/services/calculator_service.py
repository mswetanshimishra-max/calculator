def calculate_basic(expression: str) -> float:
    """
    Evaluate basic mathematical expression.
    Supports: +, -, *, /, %, parentheses
    """
    try:
        # Safety check: only allow mathematical characters
        allowed_chars = set('0123456789+-*/.() %')
        if not all(c in allowed_chars for c in expression):
            raise ValueError("Invalid characters in expression")
        
        result = eval(expression)
        
        if not isinstance(result, (int, float)):
            raise ValueError("Invalid result type")
        
        if result == float('inf') or result == float('-inf'):
            raise ValueError("Infinite result")
        
        # Trim floating-point noise: 0.1 + 0.2 -> 0.3 instead of 0.30000000000000004
        return float(f"{float(result):.12g}")
    except ZeroDivisionError:
        raise ValueError("Division by zero")
    except SyntaxError:
        raise ValueError("Invalid expression")
    except ValueError:
        raise
    except Exception as e:
        raise ValueError(f"Calculation error: {str(e)}")
