"""Portal frame demo using a 2D frame stiffness analysis."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np


@dataclass(frozen=True)
class Node:
    x: float
    y: float


@dataclass(frozen=True)
class Element:
    start: int
    end: int
    area: float
    inertia: float
    elasticity: float


def _rectangular_section(width: float, depth: float) -> tuple[float, float]:
    area = width * depth
    inertia = (width * depth**3) / 12
    return area, inertia


def _element_stiffness_local(area: float, inertia: float, elasticity: float, length: float) -> np.ndarray:
    axial = elasticity * area / length
    flexural = elasticity * inertia
    length_sq = length**2
    length_cu = length**3
    return np.array(
        [
            [axial, 0.0, 0.0, -axial, 0.0, 0.0],
            [0.0, 12 * flexural / length_cu, 6 * flexural / length_sq, 0.0, -12 * flexural / length_cu, 6 * flexural / length_sq],
            [0.0, 6 * flexural / length_sq, 4 * flexural / length, 0.0, -6 * flexural / length_sq, 2 * flexural / length],
            [-axial, 0.0, 0.0, axial, 0.0, 0.0],
            [0.0, -12 * flexural / length_cu, -6 * flexural / length_sq, 0.0, 12 * flexural / length_cu, -6 * flexural / length_sq],
            [0.0, 6 * flexural / length_sq, 2 * flexural / length, 0.0, -6 * flexural / length_sq, 4 * flexural / length],
        ]
    )


def _transformation_matrix(dx: float, dy: float, length: float) -> np.ndarray:
    cos_x = dx / length
    sin_y = dy / length
    return np.array(
        [
            [cos_x, sin_y, 0.0, 0.0, 0.0, 0.0],
            [-sin_y, cos_x, 0.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 1.0, 0.0, 0.0, 0.0],
            [0.0, 0.0, 0.0, cos_x, sin_y, 0.0],
            [0.0, 0.0, 0.0, -sin_y, cos_x, 0.0],
            [0.0, 0.0, 0.0, 0.0, 0.0, 1.0],
        ]
    )


def _assemble_global_stiffness(nodes: list[Node], elements: Iterable[Element]) -> np.ndarray:
    dof_count = len(nodes) * 3
    global_stiffness = np.zeros((dof_count, dof_count))
    for element in elements:
        start = nodes[element.start]
        end = nodes[element.end]
        dx = end.x - start.x
        dy = end.y - start.y
        length = float(np.hypot(dx, dy))
        local_stiffness = _element_stiffness_local(
            element.area,
            element.inertia,
            element.elasticity,
            length,
        )
        transform = _transformation_matrix(dx, dy, length)
        global_element = transform.T @ local_stiffness @ transform
        dof_map = [
            element.start * 3,
            element.start * 3 + 1,
            element.start * 3 + 2,
            element.end * 3,
            element.end * 3 + 1,
            element.end * 3 + 2,
        ]
        for i, row in enumerate(dof_map):
            for j, col in enumerate(dof_map):
                global_stiffness[row, col] += global_element[i, j]
    return global_stiffness


def _solve_displacements(global_stiffness: np.ndarray, loads: np.ndarray, fixed_dofs: set[int]) -> np.ndarray:
    dof_count = len(loads)
    free_dofs = [i for i in range(dof_count) if i not in fixed_dofs]
    reduced_stiffness = global_stiffness[np.ix_(free_dofs, free_dofs)]
    reduced_loads = loads[free_dofs]
    reduced_displacements = np.linalg.solve(reduced_stiffness, reduced_loads)
    displacements = np.zeros(dof_count)
    displacements[free_dofs] = reduced_displacements
    return displacements


def _element_end_forces(nodes: list[Node], element: Element, displacements: np.ndarray) -> np.ndarray:
    start = nodes[element.start]
    end = nodes[element.end]
    dx = end.x - start.x
    dy = end.y - start.y
    length = float(np.hypot(dx, dy))
    local_stiffness = _element_stiffness_local(
        element.area,
        element.inertia,
        element.elasticity,
        length,
    )
    transform = _transformation_matrix(dx, dy, length)
    dof_map = [
        element.start * 3,
        element.start * 3 + 1,
        element.start * 3 + 2,
        element.end * 3,
        element.end * 3 + 1,
        element.end * 3 + 2,
    ]
    global_disp = displacements[dof_map]
    local_disp = transform @ global_disp
    return local_stiffness @ local_disp


def main() -> None:
    elasticity = 200e9
    width = 5.0
    height = 4.0
    nodes = [
        Node(0.0, 0.0),
        Node(width, 0.0),
        Node(0.0, height),
        Node(width, height),
    ]

    column_area, column_inertia = _rectangular_section(0.2, 0.2)
    beam_area, beam_inertia = _rectangular_section(0.15, 0.3)

    elements = [
        Element(0, 2, column_area, column_inertia, elasticity),
        Element(1, 3, column_area, column_inertia, elasticity),
        Element(2, 3, beam_area, beam_inertia, elasticity),
    ]

    global_stiffness = _assemble_global_stiffness(nodes, elements)
    dof_count = len(nodes) * 3
    loads = np.zeros(dof_count)
    loads[2 * 3] = 10e3

    fixed_dofs = {0, 1, 2, 3, 4, 5}
    displacements = _solve_displacements(global_stiffness, loads, fixed_dofs)

    print("Nodal Displacements (m, rad)")
    for index, node in enumerate(nodes, start=1):
        dof = (index - 1) * 3
        ux, uy, rotation = displacements[dof : dof + 3]
        print(
            f"Node {index}: ux={ux:.6e} m, uy={uy:.6e} m, rz={rotation:.6e} rad"
        )

    print("\nMember End Forces (local coordinates, N and N-m)")
    for index, element in enumerate(elements, start=1):
        forces = _element_end_forces(nodes, element, displacements)
        (axial_start, shear_start, moment_start, axial_end, shear_end, moment_end) = forces
        print(
            f"Element {index} (node {element.start + 1} to {element.end + 1}): "
            f"N1={axial_start:.3f} N, V1={shear_start:.3f} N, M1={moment_start:.3f} N-m, "
            f"N2={axial_end:.3f} N, V2={shear_end:.3f} N, M2={moment_end:.3f} N-m"
        )


if __name__ == "__main__":
    main()
