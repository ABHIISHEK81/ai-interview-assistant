import urllib.request
import json

def test():
    base = 'http://127.0.0.1:8000'
    
    # 1. Test Demo Login (Google)
    req1 = urllib.request.Request(
        f'{base}/auth/demo-login',
        data=json.dumps({'provider': 'google'}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req1) as res1:
        d1 = json.loads(res1.read().decode())
    token = d1['access_token']
    assert token, 'Token missing'
    print('[PASS] Demo Login Google - Token received')

    # 2. Test GET /api/auth/me
    req2 = urllib.request.Request(f'{base}/api/auth/me', headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req2) as res2:
        d2 = json.loads(res2.read().decode())
    assert d2['authenticated'] is True
    user = d2['user']
    print(f"[PASS] Authenticated Me: {user.get('name')} ({user.get('email')})")

    # 3. Test GET /api/profile
    req3 = urllib.request.Request(f'{base}/api/profile', headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req3) as res3:
        d3 = json.loads(res3.read().decode())
    assert d3['success'] is True
    prof = d3['profile']
    print(f"[PASS] Profile Loaded: Primary Field = {prof.get('primary_field')}, Edu Count = {len(prof.get('education', []))}")

    # 4. Test PUT /api/profile with Physics & Extracurriculars
    update_data = {
        'name': 'Dr. Alex Mercer',
        'phone': '+1 (555) 345-6789',
        'primary_field': 'Physics & Computational Modeling',
        'bio_summary': 'Ph.D. in Theoretical Physics with 5+ years scientific computing experience.',
        'linkedin_url': 'https://linkedin.com/in/alex-mercer-physics',
        'github_url': 'https://github.com/alexmercer-physics',
        'portfolio_url': 'https://alexmercer-physics.io/research',
        'other_activities': 'Director of Princeton Choral Ensemble (35 singers); Traditional folk acoustic guitar performer at East Coast Arts; 1st Place National Physics Olympiad.',
        'education': [
            {
                'degree_title': 'Ph.D. in Theoretical Physics',
                'field_of_study': 'Quantum Field Simulation',
                'institution': 'Princeton University',
                'start_year': '2019',
                'end_year': '2024'
            },
            {
                'degree_title': 'B.S. in Physics & Applied Mathematics',
                'field_of_study': 'Physics',
                'institution': 'MIT',
                'start_year': '2015',
                'end_year': '2019'
            }
        ]
    }
    req4 = urllib.request.Request(
        f'{base}/api/profile',
        data=json.dumps(update_data).encode(),
        headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'},
        method='PUT'
    )
    with urllib.request.urlopen(req4) as res4:
        d4 = json.loads(res4.read().decode())
    assert d4['success'] is True
    saved_prof = d4['profile']
    assert len(saved_prof['education']) == 2
    assert 'Princeton' in saved_prof['education'][0]['institution']
    assert 'Choral' in saved_prof['other_activities']
    print(f"[PASS] Profile Updated in SQLite: {saved_prof.get('name')} - {len(saved_prof.get('education', []))} degrees saved")

    # 5. Verify 401 on missing token
    try:
        req5 = urllib.request.Request(f'{base}/api/profile')
        urllib.request.urlopen(req5)
        assert False, 'Expected 401'
    except urllib.error.HTTPError as e:
        assert e.code == 401
        print('[PASS] Unauthenticated request correctly rejected with 401 Unauthorized')

    print('\nALL END-TO-END FLOW TESTS COMPLETED WITH 100% SUCCESS!')

if __name__ == '__main__':
    test()
