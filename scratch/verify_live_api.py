import urllib.request
import json

BASE = 'http://127.0.0.1:8000'

# 1. Guest login
req = urllib.request.Request(f'{BASE}/auth/guest-login', data=b'{}', headers={'Content-Type': 'application/json'}, method='POST')
with urllib.request.urlopen(req) as res:
    guest_data = json.loads(res.read())
    token = guest_data['access_token']
    print('[OK] Guest login token:', token[:20] + '...')

# 2. Check /api/auth/me
req = urllib.request.Request(f'{BASE}/api/auth/me', headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req) as res:
    me_data = json.loads(res.read())
    print('[OK] Me data email:', me_data['user']['email'])

# 3. Update Profile with full educational + physics + extracurricular details
update_payload = {
    'name': 'Dr. Alex Mercer',
    'full_name': 'Dr. Alex Mercer',
    'email': 'alex.mercer.physics@gmail.com',
    'phone': '+1 (555) 234-5678',
    'primary_field': 'Physics & Computational Science',
    'linkedin_url': 'https://www.linkedin.com/in/alex-mercer-physics',
    'github_url': 'https://github.com/alexmercer-physics',
    'portfolio_url': 'https://alexmercer-physics.io/research',
    'other_activities': 'Director of Regional Classical Choir; Traditional folk acoustic guitar performer; 1st Place National Physics Challenge.',
    'bio_summary': 'Ph.D. in Theoretical Physics with 5+ years scientific computing experience.',
    'education': [
        {
            'degree_title': 'Ph.D. in Theoretical Physics',
            'field_of_study': 'Quantum Field Simulation & Computational Science',
            'institution': 'Princeton University',
            'start_year': '2019',
            'end_year': '2024',
            'grade_or_honors': 'Summa Cum Laude'
        },
        {
            'degree_title': 'B.S. in Physics & Applied Mathematics',
            'field_of_study': 'Physics',
            'institution': 'MIT',
            'start_year': '2015',
            'end_year': '2019',
            'grade_or_honors': "Dean's Honor List"
        }
    ]
}

req = urllib.request.Request(
    f'{BASE}/api/profile',
    data=json.dumps(update_payload).encode('utf-8'),
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {token}'},
    method='PUT'
)
with urllib.request.urlopen(req) as res:
    res_data = json.loads(res.read())
    saved_prof = res_data['profile']
    print('[OK] Saved profile name:', saved_prof['full_name'])
    print('[OK] Saved profile primary_field:', saved_prof['primary_field'])
    print('[OK] Saved profile edu count:', len(saved_prof['education']))
    print('[OK] Saved profile other_activities:', saved_prof['other_activities'])

# 4. Fetch Profile via GET
req = urllib.request.Request(f'{BASE}/api/profile', headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req) as res:
    get_prof = json.loads(res.read())['profile']
    assert get_prof['full_name'] == 'Dr. Alex Mercer'
    assert len(get_prof['education']) == 2
    print('[OK] Verified GET /api/profile persistence in SQLite!')

# 5. Check /auth/google
with urllib.request.urlopen(f'{BASE}/auth/google') as res:
    html = res.read().decode('utf-8')
    assert 'localStorage.setItem' in html
    assert 'window.location.href = "/#profile"' in html
    print('[OK] Verified /auth/google instant demo redirect!')

# 6. Check /auth/linkedin
with urllib.request.urlopen(f'{BASE}/auth/linkedin') as res:
    html = res.read().decode('utf-8')
    assert 'localStorage.setItem' in html
    assert 'window.location.href = "/#profile"' in html
    print('[OK] Verified /auth/linkedin instant demo redirect!')

print('\n*** ALL 6 API AND AUTH WORKFLOW CHECKS PASSED WITH 100% SUCCESS! ***')
