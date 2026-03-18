import requests
import sys
import json
from datetime import datetime

class CECyTEAPITester:
    def __init__(self, base_url="https://virtual-tour-cecyte.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.session = requests.Session()

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)
        if self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                if response.content:
                    try:
                        resp_data = response.json()
                        if isinstance(resp_data, dict) and len(resp_data) <= 5:
                            print(f"   Response: {json.dumps(resp_data, indent=2)}")
                        elif isinstance(resp_data, list) and len(resp_data) <= 3:
                            print(f"   Response: Found {len(resp_data)} items")
                    except:
                        print(f"   Response: {response.text[:200]}...")
            else:
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                if response.content:
                    try:
                        error_data = response.json()
                        print(f"   Error: {error_data}")
                    except:
                        print(f"   Error: {response.text[:200]}")

            return success, response.json() if success and response.content else {}

        except Exception as e:
            print(f"❌ FAILED - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINTS")
        print("="*50)
        
        self.run_test("API Root", "GET", "api/", 200)
        self.run_test("Health Check", "GET", "api/health", 200)
        return True

    def test_admin_login(self):
        """Test admin login"""
        print("\n" + "="*50)
        print("TESTING ADMIN AUTHENTICATION")
        print("="*50)
        
        # Test admin login with correct credentials
        login_data = {"username": "admin", "password": "cecyte04admin"}
        success, response = self.run_test(
            "Admin Login (Valid Credentials)",
            "POST",
            "api/admin/login",
            200,
            data=login_data
        )
        
        if success:
            # Extract admin token from cookies or response
            print("✅ Admin login successful")
            # Test admin check
            success2, response2 = self.run_test(
                "Admin Check After Login",
                "GET",
                "api/admin/check",
                200
            )
            if success2 and response2.get('is_admin'):
                print("✅ Admin status confirmed")
                return True
        
        # Test invalid credentials
        invalid_data = {"username": "admin", "password": "wrongpassword"}
        self.run_test(
            "Admin Login (Invalid Credentials)",
            "POST",
            "api/admin/login",
            401,
            data=invalid_data
        )
        
        return success

    def test_especialidades_endpoints(self):
        """Test especialidades/specialties endpoints"""
        print("\n" + "="*50)
        print("TESTING ESPECIALIDADES ENDPOINTS")
        print("="*50)
        
        success, especialidades = self.run_test(
            "Get All Especialidades",
            "GET",
            "api/especialidades",
            200
        )
        
        if success and isinstance(especialidades, list) and len(especialidades) > 0:
            print(f"✅ Found {len(especialidades)} especialidades")
            
            # Test individual especialidad
            first_esp = especialidades[0]
            esp_id = first_esp.get('especialidad_id')
            if esp_id:
                self.run_test(
                    f"Get Especialidad '{esp_id}'",
                    "GET",
                    f"api/especialidad/{esp_id}",
                    200
                )
            
            # Test non-existent especialidad
            self.run_test(
                "Get Non-existent Especialidad",
                "GET",
                "api/especialidad/nonexistent",
                404
            )
        
        return success

    def test_campus_info(self):
        """Test campus information endpoint"""
        print("\n" + "="*50)
        print("TESTING CAMPUS INFO")
        print("="*50)
        
        success, campus_data = self.run_test(
            "Get Campus Info",
            "GET",
            "api/campus/info",
            200
        )
        
        if success:
            required_fields = ['nombre', 'coordenadas', 'especialidades']
            for field in required_fields:
                if field in campus_data:
                    print(f"✅ Campus info contains '{field}'")
                else:
                    print(f"❌ Campus info missing '{field}'")
        
        return success

    def test_simulation_endpoints(self):
        """Test future simulation endpoints"""
        print("\n" + "="*50)
        print("TESTING SIMULATION ENDPOINTS")
        print("="*50)
        
        # Test story generation
        simulation_data = {
            "nombre": "Ana Rodriguez",
            "sexo": "femenino",
            "intereses": ["Tecnologia", "Programacion", "Robotica"],
            "carrera": "Programacion"
        }
        
        story_success, story_response = self.run_test(
            "Generate Story (GPT-5.2)",
            "POST",
            "api/simulation/generate-story",
            200,
            data=simulation_data
        )
        
        if story_success and story_response.get('historia'):
            print(f"✅ Story generated: {len(story_response['historia'])} characters")
        
        # Test avatar generation
        avatar_success, avatar_response = self.run_test(
            "Generate Avatar Config",
            "POST",
            "api/simulation/generate-avatar",
            200,
            data=simulation_data
        )
        
        if avatar_success and avatar_response.get('avatar_config'):
            print("✅ Avatar config generated")
            print(f"   Avatar details: {json.dumps(avatar_response['avatar_config'], indent=2)}")
        
        # Test image generation (may fail due to API costs/limits)
        print("\n🔍 Testing Image Generation (GPT Image 1)...")
        image_success, image_response = self.run_test(
            "Generate Image (GPT Image 1)",
            "POST",
            "api/simulation/generate-image",
            200,
            data=simulation_data
        )
        
        if image_success and image_response.get('imagen_base64'):
            print("✅ Image generated successfully")
        elif not image_success:
            print("⚠️  Image generation may be expected to fail (API limits/costs)")
        
        return story_success or avatar_success

    def test_3d_models_endpoints(self):
        """Test 3D models endpoints (admin required)"""
        print("\n" + "="*50)
        print("TESTING 3D MODELS ENDPOINTS")
        print("="*50)
        
        # Test getting active model (public)
        self.run_test(
            "Get Active Model (Public)",
            "GET",
            "models/active",
            200
        )
        
        # Test admin models endpoint (requires admin)
        admin_success, models = self.run_test(
            "Get All Models (Admin)",
            "GET",
            "api/admin/models",
            200 if self.admin_token else 403
        )
        
        if admin_success:
            print(f"✅ Found {len(models) if isinstance(models, list) else 0} models")
        
        return True

    def test_tarjetas_positions(self):
        """Test tarjetas positions endpoints"""
        print("\n" + "="*50)
        print("TESTING TARJETAS POSITIONS")
        print("="*50)
        
        # Test getting tarjeta positions (public)
        success, positions = self.run_test(
            "Get Tarjeta Positions",
            "GET",
            "api/tarjetas/positions",
            200
        )
        
        if success and isinstance(positions, list):
            print(f"✅ Found {len(positions)} tarjeta positions")
            for pos in positions[:2]:  # Show first 2
                if 'position' in pos:
                    print(f"   Position: {pos.get('especialidad_id')} -> {pos['position']}")
        
        return success

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%" if self.tests_run > 0 else "No tests run")
        
        if self.tests_passed == self.tests_run:
            print("🎉 ALL TESTS PASSED!")
            return 0
        else:
            print(f"❌ {self.tests_run - self.tests_passed} TESTS FAILED")
            return 1

def main():
    print("🚀 CECyTE 04 Dreams API Testing Suite")
    print("=====================================")
    
    tester = CECyTEAPITester()
    
    # Run all tests
    tester.test_health_check()
    admin_success = tester.test_admin_login()
    tester.test_especialidades_endpoints()
    tester.test_campus_info()
    tester.test_simulation_endpoints()
    tester.test_3d_models_endpoints()
    tester.test_tarjetas_positions()
    
    # Print summary
    return tester.print_summary()

if __name__ == "__main__":
    sys.exit(main())