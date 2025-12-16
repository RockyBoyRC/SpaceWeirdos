# Import/Export Troubleshooting Guide

## Common Import Issues

### File Format Problems

#### Invalid JSON Data Error
**Error Message:** "Invalid JSON data provided"

**Causes:**
- File is not a valid JSON format
- File was corrupted during transfer
- File was manually edited and syntax errors introduced
- Wrong file type selected (not a warband export)

**Solutions:**
1. **Verify File Source**: Ensure the file was exported from Space Weirdos Warband Builder
2. **Check File Extension**: File should have `.json` extension
3. **Validate JSON**: Use an online JSON validator to check file structure
4. **Re-export**: If you have the original warband, export it again
5. **Check File Size**: Ensure file isn't empty or truncated

#### File Size Issues
**Error Message:** "File too large" or timeout errors

**Causes:**
- File exceeds 10MB limit (very rare for warband files)
- Network timeout during upload
- Browser memory limitations

**Solutions:**
1. **Check File Size**: Warband files should typically be under 100KB
2. **Network Connection**: Try on a faster, more stable connection
3. **Browser Refresh**: Refresh the page and try again
4. **Different Browser**: Try importing in a different browser

### Validation Errors

#### Missing Game Data References
**Error Message:** "Missing weapon/equipment reference"

**Causes:**
- Warband uses weapons/equipment not in current game data
- Game data was updated since warband was exported
- Warband was created with custom or modified game data

**Solutions:**
1. **Check Warnings**: These are often warnings, not blocking errors
2. **Update Game Data**: Ensure you have the latest game data files
3. **Manual Editing**: Edit the JSON file to use valid references
4. **Accept Warnings**: Import anyway and fix issues in the editor

#### Point Limit Violations
**Error Message:** "Cost exceeded" or "Point limit violation"

**Causes:**
- Game rules changed since warband was created
- Warband was created with different point limits
- Cost calculation differences between versions

**Solutions:**
1. **Review Costs**: Check individual weirdo costs in the file
2. **Update Point Limits**: Modify warband to use current limits
3. **Edit Weirdos**: Reduce costs by changing attributes or equipment
4. **Check Abilities**: Ensure warband abilities are applied correctly

#### Structure Validation Errors
**Error Message:** "Missing required field" or "Invalid data type"

**Causes:**
- File structure doesn't match expected format
- Required fields are missing or null
- Data types don't match expected values

**Solutions:**
1. **Compare Structure**: Check against a known good export
2. **Add Missing Fields**: Add required fields with default values
3. **Fix Data Types**: Ensure numbers are numbers, strings are strings
4. **Use Template**: Start with a fresh export as a template

### Name Conflict Issues

#### Duplicate Warband Names
**Error Message:** "A warband with this name already exists"

**Causes:**
- Importing a warband with the same name as an existing one
- Previous import attempt left partial data

**Solutions:**
1. **Rename Option**: Choose to rename the imported warband
2. **Replace Option**: Replace the existing warband (careful!)
3. **Manual Rename**: Edit the JSON file to change the name before import
4. **Check Existing**: Review your warband list to identify conflicts

#### Name Validation Issues
**Error Message:** "Invalid warband name"

**Causes:**
- Name contains invalid characters
- Name is too long or too short
- Name is empty or only whitespace

**Solutions:**
1. **Use Valid Characters**: Stick to letters, numbers, spaces, and basic punctuation
2. **Check Length**: Names should be 1-100 characters
3. **Remove Special Characters**: Avoid symbols that might cause issues
4. **Provide Default**: Use a simple name like "Imported Warband"

## Common Export Issues

### Export Failures

#### Warband Not Found
**Error Message:** "Warband with ID not found"

**Causes:**
- Warband was deleted after page load
- Database corruption or sync issues
- Browser cache issues

**Solutions:**
1. **Refresh Page**: Reload the warband list
2. **Check Warband**: Verify the warband still exists
3. **Clear Cache**: Clear browser cache and reload
4. **Restart Application**: Close and reopen the application

#### Download Issues
**Error Message:** Download doesn't start or fails

**Causes:**
- Browser blocking downloads
- Insufficient disk space
- Browser security settings

**Solutions:**
1. **Check Downloads**: Look in browser's download folder
2. **Allow Downloads**: Enable downloads for the site
3. **Disk Space**: Ensure sufficient free disk space
4. **Try Different Browser**: Use a different browser
5. **Disable Extensions**: Temporarily disable browser extensions

### File Naming Issues

#### Invalid Characters in Filename
**Problem:** Downloaded file has strange characters or underscores

**Causes:**
- Warband name contains special characters
- Filename sanitization applied

**Solutions:**
1. **Expected Behavior**: This is normal for names with special characters
2. **Rename After Download**: Rename the file after downloading if needed
3. **Simplify Warband Name**: Use simpler names to avoid sanitization
4. **Keep Original**: The warband data inside the file is unchanged

## Network and Server Issues

### Connection Problems

#### Timeout Errors
**Error Message:** "Operation timed out" or "Request timeout"

**Causes:**
- Slow network connection
- Server temporarily unavailable
- Large file processing time

**Solutions:**
1. **Retry**: Wait a moment and try again
2. **Check Connection**: Ensure stable internet connection
3. **Smaller Files**: Try with smaller warbands first
4. **Different Time**: Try during off-peak hours
5. **Contact Support**: If persistent, report the issue

#### Server Errors
**Error Message:** "Internal server error" or "Server unavailable"

**Causes:**
- Temporary server issues
- Maintenance in progress
- Server overload

**Solutions:**
1. **Wait and Retry**: Server issues are often temporary
2. **Check Status**: Look for maintenance announcements
3. **Try Later**: Attempt the operation at a different time
4. **Report Issue**: Contact support if error persists

## Advanced Troubleshooting

### Manual File Editing

**When to Edit Manually:**
- Minor validation issues that are easy to fix
- Need to update references to current game data
- Want to batch-modify multiple warbands

**Safety Guidelines:**
1. **Backup First**: Always keep a copy of the original file
2. **Validate JSON**: Use a JSON validator after editing
3. **Small Changes**: Make minimal changes to reduce error risk
4. **Test Import**: Test with a copy before using the edited file

**Common Edits:**
```json
// Fix missing required fields
{
  "name": "My Warband",
  "pointLimit": 75,  // Add if missing
  "totalCost": 65,   // Add if missing
  "weirdos": []      // Add if missing
}

// Update weapon references
{
  "weapons": {
    "close": ["Unarmed"],           // Use current weapon names
    "ranged": ["Assault Rifle"]     // Check against current data
  }
}

// Fix point limit issues
{
  "pointLimit": 75,    // Change from 125 if needed
  "totalCost": 65      // Ensure under limit
}
```

### Browser-Specific Issues

#### Chrome/Chromium
- **Downloads**: Check chrome://downloads/ for blocked downloads
- **Security**: Disable "Safe Browsing" temporarily if needed
- **Extensions**: Disable ad blockers that might interfere

#### Firefox
- **Downloads**: Check about:preferences#privacy for download settings
- **Security**: Adjust security.tls.insecure_fallback_hosts if needed
- **Extensions**: Disable privacy extensions temporarily

#### Safari
- **Downloads**: Check Safari > Preferences > General > File download location
- **Security**: Allow downloads from the site in security settings
- **Cache**: Clear website data if experiencing issues

#### Edge
- **Downloads**: Check edge://downloads/ for download history
- **Security**: Adjust SmartScreen settings if blocking downloads
- **Compatibility**: Use compatibility mode if needed

## Getting Help

### Before Contacting Support

1. **Try Basic Solutions**: Refresh page, clear cache, try different browser
2. **Check File**: Verify the file isn't corrupted or modified
3. **Test with Simple Case**: Try importing a freshly exported warband
4. **Document Error**: Note exact error messages and steps to reproduce

### Information to Include

When reporting issues, include:
- **Error Message**: Exact text of any error messages
- **Browser**: Browser name and version
- **File Details**: File size, source, any modifications made
- **Steps**: Exact steps taken before the error occurred
- **Warband Info**: Warband name, complexity, special features used

### Workarounds

While waiting for fixes:
- **Manual Recreation**: Recreate simple warbands manually
- **Partial Import**: Import individual weirdos if possible
- **Alternative Formats**: Use screenshots or text descriptions temporarily
- **Backup Strategy**: Export frequently to minimize data loss

This troubleshooting guide covers the most common issues users encounter with the import/export system. Most problems can be resolved with the solutions provided above.