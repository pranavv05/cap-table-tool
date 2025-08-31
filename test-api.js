const test = async () => {
  console.log('Testing company creation API...')
  
  const testData = {
    name: "Test Company",
    description: "A test company",
    incorporation_date: "2024-01-01",
    jurisdiction: "delaware",
    company_type: "C-Corp",
    authorized_shares: 10000000,
    par_value: 0.001
  }
  
  try {
    const response = await fetch('http://localhost:3000/api/companies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    console.log('Response status:', response.status)
    console.log('Response body:', result)
    
    if (response.ok) {
      console.log('✅ API test successful!')
    } else {
      console.log('❌ API test failed:', result.error)
    }
  } catch (error) {
    console.error('Test failed with error:', error)
  }
}

// Only run test if this is not in browser
if (typeof window === 'undefined') {
  test()
} else {
  console.log('Test script loaded - call test() to run')
  window.testAPI = test
}