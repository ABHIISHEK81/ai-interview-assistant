import re
from email import message_from_bytes

content_type = 'multipart/form-data; boundary=----WebKitFormBoundaryXYZ'
raw_body = b'''------WebKitFormBoundaryXYZ\r
Content-Disposition: form-data; name="role"\r
\r
Software Developer\r
------WebKitFormBoundaryXYZ\r
Content-Disposition: form-data; name="resume"; filename="resume.pdf"\r
Content-Type: application/pdf\r
\r
%PDF-1.4 minimal binary data here\r
------WebKitFormBoundaryXYZ--\r
'''

msg = message_from_bytes(b'Content-Type: ' + content_type.encode() + b'\r\n\r\n' + raw_body)
fields = {}
files = {}
for part in msg.walk():
    cd = part.get('Content-Disposition', '')
    if 'form-data' in cd:
        name_match = re.search(r'name="([^"]+)"', cd)
        filename_match = re.search(r'filename="([^"]+)"', cd)
        if name_match:
            field_name = name_match.group(1)
            payload = part.get_payload(decode=True)
            if filename_match:
                files[field_name] = (filename_match.group(1), payload)
            else:
                fields[field_name] = payload.decode('utf-8', errors='ignore')

print('Fields:', fields)
print('Files:', {k: (v[0], len(v[1])) for k, v in files.items()})
assert fields['role'] == 'Software Developer'
assert files['resume'][0] == 'resume.pdf'
print('MULTIPART PARSING TEST PASSED!')
