import math
import re


def _make_namespace(is_degree: bool) -> dict:
    """Names that are allowed inside a scientific expression."""
    if is_degree:
        sin = lambda x: math.sin(math.radians(x))
        cos = lambda x: math.cos(math.radians(x))
        tan = lambda x: math.tan(math.radians(x))
    else:
        sin, cos, tan = math.sin, math.cos, math.tan

    return {
        "sin": sin,
        "cos": cos,
        "tan": tan,
        "log": math.log10,
        "ln": math.log,
        "sqrt": math.sqrt,
        "abs": abs,
        "pi": math.pi,
        "e": math.e,
    }


def calculate_scientific(expression: str, is_degree: bool = True) -> float:
    """
    Evaluate scientific mathematical expression.
    Supports: sin, cos, tan, log (base 10), ln, sqrt, abs, pi/π, e, ^, + - * / %, brackets.
    """
    try:
        expr = expression.strip()
        if not expr:
            raise ValueError("Empty expression")

        expr = expr.replace("π", "pi").replace("^", "**")
        expr = expr.replace("×", "*").replace("÷", "/").replace("−", "-")

        # Allow only digits, operators, brackets, spaces, dots and known names
        if not re.fullmatch(r"[0-9a-z+\-*/%(). ]*", expr):
            raise ValueError("Invalid characters in expression")

        namespace = _make_namespace(is_degree)
        for name in re.findall(r"[a-z]+", expr):
            # "e" can also appear inside scientific notation like 1e-7, which is fine
            if name not in namespace:
                raise ValueError(f"Unknown function or name: {name}")

        # Auto-close missing brackets, e.g. "sin(30" -> "sin(30)"
        missing = expr.count("(") - expr.count(")")
        if missing > 0:
            expr += ")" * missing

        result = eval(expr, {"__builtins__": {}}, namespace)

        if isinstance(result, bool) or not isinstance(result, (int, float)):
            raise ValueError("Invalid result type")

        result = float(result)
        if math.isinf(result):
            raise ValueError("Infinite result")
        if math.isnan(result):
            raise ValueError("Invalid result (NaN)")

        # Trim floating-point noise: sin(30°) -> 0.5 instead of 0.49999999999999994
        return float(f"{result:.12g}")
    except ZeroDivisionError:
        raise ValueError("Division by zero")
    except ValueError as e:
        msg = str(e)
        if msg == "math domain error":
            raise ValueError("Math domain error (e.g. sqrt/log of a negative number)")
        raise ValueError(msg)
    except SyntaxError:
        raise ValueError("Invalid expression")
    except OverflowError:
        raise ValueError("Result too large")
    except Exception as e:
        raise ValueError(f"Calculation error: {str(e)}")
