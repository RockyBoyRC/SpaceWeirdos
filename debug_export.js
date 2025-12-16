// Debug script to test export functionality
const fetch = require('node-fetch');

async function testExport() {
  try {
    // First, let's check if the server is running and get all warbands
    console.log('Testing export functionality...');
    
    const response = await fetch('http://localhost:3001/api/warbands');
    if (!response.ok) {
      console.error('Failed to get warbands:', response.status, response.statusText);
      return;
    }
    
    const warbands = await response.json();
    console.log('Found warbands:', warbands.length);
    
    if (warbands.length === 0) {
      console.log('No warbands found to export');
      return;
    }
    
    // Try to export the first warband
    const firstWarband = warbands[0];
    console.log('Attempting to export warband:', firstWarband.name, 'ID:', firstWarband.id);
    
    const exportResponse = await fetch(`http://localhost:3001/api/warbands/${firstWarband.id}/export`);
    console.log('Export response status:', exportResponse.status);
    console.log('Export response headers:', Object.fromEntries(exportResponse.headers.entries()));
    
    if (!exportResponse.ok) {
      const errorText = await exportResponse.text();
      console.error('Export failed:', errorText);
      return;
    }
    
    const exportData = await exportResponse.json();
    console.log('Export successful! Data keys:', Object.keys(exportData));
    console.log('Export data sample:', {
      name: exportData.name,
      exportVersion: exportData.exportVersion,
      exportedBy: exportData.exportedBy
    });
    
  } catch (error) {
    console.error('Error during export test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testExport();