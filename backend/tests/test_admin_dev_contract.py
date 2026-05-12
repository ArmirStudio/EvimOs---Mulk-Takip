import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from api.routes import admin, users
from models import schemas


class AdminDevContractTest(unittest.TestCase):
    def test_admin_dev_routes_are_registered(self):
        paths = {route.path for route in admin.router.routes}

        self.assertIn("/admin/dev/users", paths)
        self.assertIn("/admin/dev/agents", paths)
        self.assertIn("/admin/dev/link-user", paths)

    def test_legal_acceptance_model_exists(self):
        self.assertTrue(hasattr(schemas, "LegalAcceptanceRequest"))

    def test_user_legal_acceptance_route_is_registered(self):
        paths = {route.path for route in users.router.routes}

        self.assertIn("/users/me/legal-acceptance", paths)


if __name__ == "__main__":
    unittest.main()
