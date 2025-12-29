"""Beam deflection calculations for a simply supported beam with UDL."""

from __future__ import annotations


def _validate_positive(value: float, name: str) -> float:
    if value <= 0:
        raise ValueError(f"{name} must be positive; got {value}.")
    return float(value)


def _validate_position(x: float, length: float) -> float:
    if x < 0 or x > length:
        raise ValueError(f"x must be within [0, {length}]; got {x}.")
    return float(x)


def maximum_deflection_uniform_load(
    load_per_length: float, length: float, elasticity: float, inertia: float
) -> float:
    """Return maximum deflection for a simply supported beam with UDL.

    Formula: delta_max = 5 w L^4 / (384 E I)
    """
    w = _validate_positive(load_per_length, "load_per_length")
    l = _validate_positive(length, "length")
    e = _validate_positive(elasticity, "elasticity")
    i = _validate_positive(inertia, "inertia")
    return (5 * w * l**4) / (384 * e * i)


def bending_moment_uniform_load(load_per_length: float, length: float, x: float) -> float:
    """Return bending moment at position x for a simply supported beam with UDL.

    Formula: M(x) = w x (L - x) / 2
    """
    w = _validate_positive(load_per_length, "load_per_length")
    l = _validate_positive(length, "length")
    xpos = _validate_position(x, l)
    return w * xpos * (l - xpos) / 2


def shear_force_uniform_load(load_per_length: float, length: float, x: float) -> float:
    """Return shear force at position x for a simply supported beam with UDL.

    Formula: V(x) = w (L/2 - x)
    """
    w = _validate_positive(load_per_length, "load_per_length")
    l = _validate_positive(length, "length")
    xpos = _validate_position(x, l)
    return w * (l / 2 - xpos)


__all__ = [
    "maximum_deflection_uniform_load",
    "bending_moment_uniform_load",
    "shear_force_uniform_load",
]
