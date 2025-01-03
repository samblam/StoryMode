// security-tests.js

// Simple FormData polyfill for Node
class MockFormData {
    constructor() {
      this.data = new Map();
    }
  
    append(key, value) {
      this.data.set(key, value);
    }
  
    toString() {
      return JSON.stringify(Object.fromEntries(this.data));
    }
  }
  const BASE_URL = 'http://localhost:4321';
  
  // Test configurations
  const xssTestCases = [
    `<script>console.log('xss')</script>`,
    `javascript:console.log('xss')`,
    `"><img src=x onerror="console.log('xss')">`,
    `' OR '1'='1`,
    `'; DROP TABLE users--`,
    `<img src="x" onerror="console.log('xss')">`,
    `${console.log('xss')}`,
    `http://evil.com/xss.js`,
    `<svg/onload="console.log('xss')">`,
    `'"><script>fetch('http://evil.com')</script>`,
    `data:text/html;base64,PHNjcmlwdD5jb25zb2xlLmxvZygneHNzJyk8L3NjcmlwdD4=`,
    `<a href="javascript:console.log('xss')">Click me</a>`
  ];
  
  // Split endpoints by auth requirement
  const publicEndpoints = [
    '/api/auth/login',
    '/api/send-email',
  ];
  
  const protectedEndpoints = [
    '/api/auth/create-user',
    '/api/sound-profiles',
    '/api/sounds/upload'
  ];
  
  const validationTestCases = [
    // Email tests
    { field: 'email', value: 'not-an-email', shouldPass: false },
    { field: 'email', value: 'test@example.com', shouldPass: true },
    { field: 'email', value: '@invalid.com', shouldPass: false },
    
    // Name tests
    { field: 'name', value: '', shouldPass: false },
    { field: 'name', value: 'a', shouldPass: false },
    { field: 'name', value: 'Valid Name', shouldPass: true },
    { field: 'name', value: 'Valid-Name123', shouldPass: true },
    { field: 'name', value: '<script>Bad Name</script>', shouldPass: false },
    
    // Description tests
    { field: 'description', value: 'too short', shouldPass: false },
    { field: 'description', value: 'A valid description that makes sense', shouldPass: true },
    { field: 'description', value: 'a'.repeat(1001), shouldPass: false },
    
    // Password tests
    { field: 'password', value: 'short', shouldPass: false },
    { field: 'password', value: 'ValidP@ssw0rd', shouldPass: true }
  ];
  
  // Test results tracking
  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    byCategory: {
      public: { total: 0, passed: 0, failed: 0 },
      protected: { total: 0, passed: 0, failed: 0 },
      fileUpload: { total: 0, passed: 0, failed: 0 }
    }
  };
  
  // Authentication helper
  // Test mode configuration
  const TEST_MODE = true;
  const TEST_AUTH_TOKEN = 'test-auth-token';

  async function getAuthToken() {
    if (TEST_MODE) {
      console.log('⚠️ Running in test mode - using test auth token');
      return TEST_AUTH_TOKEN;
    }

    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@storymode.test',
          password: 'testpassword'
        })
      });
  
      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      const cookies = response.headers.get('set-cookie');
      const authCookie = cookies?.split(';')[0];
      
      return authCookie;
    } catch (error) {
      console.error('Authentication failed:', error);
      return null;
    }
  }
  
  // Test Functions
  // Rate limiting configuration
  const REQUEST_DELAY = 500; // 500ms between requests
  const MAX_RETRIES = 3;

  async function testEndpointSanitization(endpoint, field, authToken = null) {
    console.log(`\n🔍 Testing XSS on ${endpoint} - field: ${field}`);
    console.log('----------------------------------------');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken && { 'Cookie': authToken })
    };
    
    for (const xssCase of xssTestCases) {
      const payload = { [field]: xssCase };
      
      try {
        let retries = 0;
        let success = false;
        
        while (retries < MAX_RETRIES && !success) {
          const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
          });

          // Handle rate limiting
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After') || 1;
            console.log(`Rate limited - retrying in ${retryAfter} seconds`);
            await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
            retries++;
            continue;
          }

          const isProtected = protectedEndpoints.includes(endpoint);
          const category = isProtected ? 'protected' : 'public';
          
          // A test passes if:
          // 1. It's rejected with 400 (bad request) or
          // 2. It's a protected route and returns 401/403 without auth
          const passed = response.status === 400 ||
                        (isProtected && !authToken && [401, 403].includes(response.status));
          
          updateResults(category, passed);
          success = true;
          
          console.log(`\nTest Case: ${xssCase.slice(0, 50)}${xssCase.length > 50 ? '...' : ''}`);
          console.log(`Status: ${response.status} ${passed ? '✅' : '❌'}`);
          
          try {
            const data = await response.json();
            console.log(`Response: ${JSON.stringify(data)}`);
          } catch (error) {
            console.log('Response: [non-JSON response]');
          }
        }
      } catch (error) {
        console.log(`Error testing ${endpoint}: ${error.message}`);
        updateResults(isProtected ? 'protected' : 'public', false);
      }
      
      // Add delay between test cases
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
    }
  }
   
  async function testInputValidation(endpoint, authToken = null) {
    console.log(`\n📝 Testing Input Validation on ${endpoint}`);
    console.log('----------------------------------------');
    
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken && { 'Cookie': authToken })
    };
    
    for (const testCase of validationTestCases) {
      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ [testCase.field]: testCase.value })
        });
        
        const isProtected = protectedEndpoints.includes(endpoint);
        const category = isProtected ? 'protected' : 'public';
        
        // Define what constitutes a pass based on the context
        const passed = (testCase.shouldPass && response.status === 200) ||
                      (!testCase.shouldPass && response.status === 400) ||
                      (isProtected && !authToken && [401, 403].includes(response.status));
        
        updateResults(category, passed);
        
        console.log(`\nField: ${testCase.field}`);
        console.log(`Value: ${testCase.value}`);
        console.log(`Expected: ${testCase.shouldPass ? 'pass' : 'fail'}`);
        console.log(`Result: ${passed ? '✅ Pass' : '❌ Fail'}`);
      } catch (error) {
        console.log(`Error testing ${endpoint}: ${error.message}`);
        updateResults(isProtected ? 'protected' : 'public', false);
      }
    }
  }
  
  async function testFileUploads(authToken) {
    console.log('\n📁 Testing File Uploads');
    console.log('----------------------------------------');
  
    class NodeFile {
      constructor(content, name, options) {
        this.content = Buffer.from(content);
        this.name = name;
        this.type = options.type;
        this.size = this.content.length;
        this.lastModified = Date.now();
      }

      // Methods needed for FormData compatibility
      stream() {
        return this.content;
      }

      arrayBuffer() {
        return Promise.resolve(this.content.buffer);
      }

      text() {
        return Promise.resolve(this.content.toString());
      }
    }
  
    const invalidFiles = [
      new NodeFile('<script>alert("xss")</script>', 'malicious.mp3', { type: 'audio/mpeg' }),
      new NodeFile('normal audio'.repeat(1000000), 'toolarge.mp3', { type: 'audio/mpeg' }),
      new NodeFile('fake image', 'fake.mp3', { type: 'image/jpeg' }),
      new NodeFile('valid audio', '.htaccess', { type: 'audio/mpeg' })
    ];
  
    for (const file of invalidFiles) {
      try {
        const formData = new MockFormData();
        formData.append('sound', file);
        
        const response = await fetch(`${BASE_URL}/api/sounds/upload`, {
          method: 'POST',
          headers: {
            'Cookie': authToken
          },
          body: formData
        });
        
        // File upload tests should fail with 400 if properly validated
        const passed = response.status === 400;
        updateResults('fileUpload', passed);
        
        console.log(`\nTesting: ${file.name}`);
        console.log(`Size: ${file.size} bytes`);
        console.log(`Type: ${file.type}`);
        console.log(`Status: ${response.status} ${passed ? '✅' : '❌'}`);
        
        const responseText = await response.text();
        console.log(`Response: ${responseText}`);
      } catch (error) {
        console.log(`Error testing file upload: ${error.message}`);
        updateResults('fileUpload', false);
      }
    }
  }
  
  function updateResults(category, passed) {
    testResults.total++;
    testResults.passed += passed ? 1 : 0;
    testResults.failed += passed ? 0 : 1;
    testResults.byCategory[category].total++;
    testResults.byCategory[category].passed += passed ? 1 : 0;
    testResults.byCategory[category].failed += passed ? 0 : 1;
  }
  
  function printSummary() {
    console.log('\n📊 Test Summary');
    console.log('==============');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log('\nBy Category:');
    console.log('------------');
    Object.entries(testResults.byCategory).forEach(([category, results]) => {
      console.log(`${category.toUpperCase()}`);
      console.log(`  Total: ${results.total}`);
      console.log(`  Passed: ${results.passed} ✅`);
      console.log(`  Failed: ${results.failed} ❌`);
    });
    
    const passRate = (testResults.passed / testResults.total * 100).toFixed(1);
    console.log('\n🎯 Overall Pass Rate:', `${passRate}%`);
  }
  
  // Main test runner
  async function runAllTests() {
    console.log('🚀 Starting Security Tests');
    console.log('========================');
    
    try {
      // Test server connection
      const testResponse = await fetch(BASE_URL);
      if (!testResponse.ok) {
        throw new Error('Cannot connect to server');
      }
  
      // Get auth token for protected routes
      console.log('\n🔐 Getting authentication token...');
      const authToken = await getAuthToken();
      if (!authToken) {
        console.log('⚠️ Warning: No auth token available. Protected route tests will fail.');
      } else {
        console.log('✅ Auth token received');
      }
  
      // Test public endpoints
      console.log('\n🌐 Testing public endpoints...');
      for (const endpoint of publicEndpoints) {
        await testEndpointSanitization(endpoint, 'name');
        await testEndpointSanitization(endpoint, 'description');
        await testInputValidation(endpoint);
      }
  
      // Test protected endpoints
      console.log('\n🔒 Testing protected endpoints...');
      for (const endpoint of protectedEndpoints) {
        await testEndpointSanitization(endpoint, 'name', authToken);
        await testEndpointSanitization(endpoint, 'description', authToken);
        await testInputValidation(endpoint, authToken);
      }
  
      // Test file uploads
      if (authToken) {
        await testFileUploads(authToken);
      } else {
        console.log('\n⚠️ Skipping file upload tests - no auth token');
      }
  
      console.log('\n✨ All tests completed!');
      printSummary();
    } catch (error) {
      console.error('\n❌ Test suite failed:', error.message);
      if (error.message.includes('ECONNREFUSED')) {
        console.error('Is your development server running at', BASE_URL, '?');
      }
      printSummary();
    }
  }
  
  // Run the tests
  runAllTests();