import math
import unittest

from beam_deflection import (
    bending_moment_uniform_load,
    maximum_deflection_uniform_load,
    shear_force_uniform_load,
)


class BeamDeflectionTests(unittest.TestCase):
    def test_maximum_deflection(self):
        result = maximum_deflection_uniform_load(2.0, 3.0, 200.0, 4.0)
        expected = (5 * 2.0 * 3.0**4) / (384 * 200.0 * 4.0)
        self.assertTrue(math.isclose(result, expected, rel_tol=1e-12))

    def test_bending_moment_midspan(self):
        result = bending_moment_uniform_load(10.0, 6.0, 3.0)
        expected = 10.0 * 3.0 * (6.0 - 3.0) / 2
        self.assertTrue(math.isclose(result, expected, rel_tol=1e-12))

    def test_shear_force_left_support(self):
        result = shear_force_uniform_load(8.0, 4.0, 0.0)
        expected = 8.0 * (4.0 / 2)
        self.assertTrue(math.isclose(result, expected, rel_tol=1e-12))

    def test_validation_errors(self):
        with self.assertRaises(ValueError):
            maximum_deflection_uniform_load(-1.0, 1.0, 1.0, 1.0)
        with self.assertRaises(ValueError):
            bending_moment_uniform_load(1.0, 0.0, 0.0)
        with self.assertRaises(ValueError):
            shear_force_uniform_load(1.0, 2.0, -0.1)


if __name__ == "__main__":
    unittest.main()
