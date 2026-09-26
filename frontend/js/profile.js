/**
 * Profile Module: Full Naukri.com + Google Account Profile Management.
 * Manages Candidate Summary, Skills, Work Experience, Education, Projects,
 * Completeness Score (Strength Meter), Resume Uploads, and Google Account Security.
 */

const Profile = {
    currentProfile: null,

    // Safe DOM helper
    setTxt(id, val, fallback = '') {
        const el = document.getElementById(id);
        if (el) el.textContent = (val !== null && val !== undefined && val !== '') ? val : fallback;
    },

    setVal(id, val) {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    },

    async loadProfile() {
        const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('interviewai_token');
        if (token) {
            try {
                const res = await fetch('/api/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.profile) {
                        this.currentProfile = data.profile;
                        this.renderProfile();
                        return;
                    }
                }
            } catch (err) {
                console.warn('[Profile] Failed to fetch server profile, using default demo state:', err);
            }
        }

        // Default candidate demo profile (Priya Sharma - Senior Full-Stack Engineer)
        this.currentProfile = {
            id: 1,
            name: 'Priya Sharma',
            email: 'priya.sharma@example.com',
            phone: '+91 98765 43210',
            location: 'Bengaluru, Karnataka (Hybrid)',
            professional_title: 'Senior Full-Stack Engineer | React, Python, FastAPI & Cloud Architect',
            target_role: 'Full Stack Software Engineer',
            experience_level: 'Mid-Level',
            total_experience: '3.5 Years Exp',
            current_company: 'TechFlow Innovations',
            notice_period: '15 Days',
            annual_salary: '₹14,00,000 / yr',
            expected_salary: '₹18,00,000 - ₹22,00,000 / yr',
            job_type: 'Full-time, Permanent',
            preferred_location: 'Bengaluru, Remote, Hyderabad',
            job_status: 'Actively Interviewing',
            resume_headline: 'Senior Full-Stack Engineer with 3.5+ years of experience engineering high-performance Python FastAPI and React applications. Specialized in REST API microservices, database optimization, and AI platform integration.',
            resume_filename: 'Priya_Sharma_Resume.pdf',
            resume_uploaded_at: '24 Sep 2026, 04:30 PM',
            skills_list: ['Python', 'FastAPI', 'React.js', 'TypeScript', 'PostgreSQL', 'Docker', 'REST APIs', 'System Design', 'Redis', 'Git'],
            soft_skills_list: ['Technical Communication', 'System Architecture', 'Analytical Problem Solving', 'Agile Adaptability'],
            work_experience: [
                {
                    id: 1,
                    job_title: 'Senior Full Stack Software Engineer',
                    company: 'TechFlow Innovations',
                    location: 'Bengaluru, India',
                    start_date: '2023-07',
                    end_date: 'Present',
                    is_current: 1,
                    description: 'Architected scalable microservices using Python FastAPI and React. Optimized PostgreSQL queries and reduced API latency by 35% across 200k daily active users.'
                },
                {
                    id: 2,
                    job_title: 'Software Developer Associate',
                    company: 'InnoTech Labs',
                    location: 'Hyderabad, India',
                    start_date: '2022-01',
                    end_date: '2023-06',
                    is_current: 0,
                    description: 'Built responsive component libraries in React & TypeScript. Integrated OAuth 2.0 authentication and automated CI/CD pipeline deployments.'
                }
            ],
            education: [
                {
                    id: 1,
                    degree_title: 'B.Tech - Computer Science & Engineering',
                    field_of_study: 'Software Engineering',
                    institution: 'National Institute of Technology',
                    start_year: '2018',
                    end_year: '2022',
                    grade_or_honors: '8.9 CGPA / First Class with Distinction'
                }
            ],
            projects: [
                {
                    id: 1,
                    title: 'AI Mock Interview Intelligence System',
                    tech_stack: 'React, Python, FastAPI, SQLite, Gemini AI',
                    role: 'Lead Full Stack Architect',
                    description: 'Engineered an adaptive AI interview platform with real-time speech recognition, ATS keyword scoring, and instant evaluation.',
                    github_url: 'https://github.com/example/interviewai',
                    project_url: 'https://interviewai.example.com'
                },
                {
                    id: 2,
                    title: 'Distributed Cloud Task Orchestrator',
                    tech_stack: 'Go, Redis, Docker, PostgreSQL',
                    role: 'Backend Developer',
                    description: 'Designed a distributed background worker processing 50,000 asynchronous jobs per minute with zero task loss and automated retry queues.',
                    github_url: 'https://github.com/example/task-orchestrator',
                    project_url: 'https://taskflow.example.com'
                }
            ],
            booked_slots: [
                {
                    id: 101,
                    title: 'System Architecture & Concurrency Mock',
                    role: 'Full Stack Software Engineer',
                    slot_date: '2026-09-28',
                    slot_time: '14:30',
                    interviewer_type: 'AI Technical Interviewer',
                    status: 'Confirmed',
                    notes: 'Focus on database caching, race conditions, and REST API security.'
                }
            ],
            interview_history: [
                {
                    role: 'Full Stack Engineer',
                    created_at: '2026-09-22 15:30',
                    overall_score: 88,
                    technical_score: 92,
                    hr_score: 84,
                    summary: 'Excellent technical depth in FastAPI and React state lifecycles. Clear articulate answers.'
                },
                {
                    role: 'Senior Frontend Developer',
                    created_at: '2026-09-18 11:15',
                    overall_score: 80,
                    technical_score: 82,
                    hr_score: 78,
                    summary: 'Solid foundation in component optimization. Recommend structuring STAR responses for behavioral scenarios.'
                }
            ],
            interview_stats: {
                total_interviews: 2,
                avg_overall_score: 84,
                avg_technical_score: 87,
                avg_hr_score: 80,
                highest_score: 91,
                readiness_rating: 'Top 10% Ready',
                total_questions_solved: 18
            },
            profile_strength: {
                percentage: 90,
                level: 'All-Star Profile',
                next_step: 'Your candidate profile is 90% complete and highly optimized for recruiter discovery!'
            },
            is_subscribed: 0,
            subscription_tier: 'free'
        };

        this.renderProfile();
    },

    renderProfile() {
        const p = this.currentProfile;
        if (!p) return;

        // 1. Header Card Elements
        this.setTxt('profileDisplayName', p.name || 'Candidate');
        this.setTxt('profileProfessionalTitle', p.professional_title || p.target_role || 'Senior Full-Stack Engineer');
        this.setTxt('profileCurrentCompany', p.current_company || 'TechFlow Innovations');
        this.setTxt('profileExperience', p.total_experience || '3.5 Years Exp');
        this.setTxt('profileLocation', p.location || 'Bengaluru, India (Hybrid)');
        this.setTxt('profileNoticePeriod', p.notice_period || '15 Days');
        this.setTxt('profileAnnualSalary', p.annual_salary || '₹14,00,000 / yr');
        this.setTxt('profileExpectedSalary', p.expected_salary || '₹18,00,000 - ₹22,00,000 / yr');
        this.setTxt('profileEmail', p.email || 'candidate@example.com');
        this.setTxt('profilePhone', p.phone || '+91 98765 43210');
        this.setTxt('profileJobStatus', p.job_status || 'Actively Interviewing');

        const avatar = p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name || 'Candidate')}&background=4f46e5&color=fff&size=160`;
        const avatarImg = document.getElementById('profileAvatarImg');
        if (avatarImg) avatarImg.src = avatar;

        const tierBadge = document.getElementById('profileTierBadge');
        if (tierBadge) {
            if (p.is_subscribed) {
                const planName = p.subscription_tier === 'high_199' ? 'VIP Lifetime Active' : 'Pro Mastery Active';
                tierBadge.textContent = planName;
                tierBadge.className = 'tier-badge bg-primary text-white';
            } else {
                tierBadge.textContent = '1 Free Mock Session Available';
                tierBadge.className = 'tier-badge';
            }
        }

        // 2. Profile Strength Meter (Naukri style)
        const strength = p.profile_strength || { percentage: 90, level: 'All-Star Profile', next_step: 'Profile looking great!' };
        this.setTxt('profileStrengthScore', `${strength.percentage || 90}%`);
        this.setTxt('profileStrengthLevel', strength.level || 'All-Star Profile');
        const barElem = document.getElementById('profileStrengthBar');
        if (barElem) barElem.style.width = `${strength.percentage || 90}%`;

        const tipElem = document.getElementById('profileStrengthTip');
        if (tipElem) {
            tipElem.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> ${strength.next_step || 'Profile is ready for top recruiters!'}`;
        }

        // 3. Tab 1: Resume & Headline
        const headlineBox = document.getElementById('headlineDisplayBox');
        if (headlineBox) headlineBox.textContent = p.resume_headline || 'Professional headline not yet specified.';
        this.setTxt('profileResumeFilename', p.resume_filename || 'InterviewAI_Resume.pdf');
        this.setTxt('profileResumeUploadDate', p.resume_uploaded_at ? `Uploaded: ${p.resume_uploaded_at}` : 'Uploaded: Recent');

        // 4. Tab 2: Skills
        this.renderSkills();

        // 5. Tab 3: Work Experience
        this.renderExperience();

        // 6. Tab 4: Education
        this.renderEducation();

        // 7. Tab 5: Projects
        this.renderProjects();

        // 8. Tab 6: Career Preferences
        this.setTxt('prefTargetRole', p.target_role || 'Full Stack Software Engineer');
        this.setTxt('prefExpLevel', p.experience_level || 'Mid-Level');
        this.setTxt('prefJobType', p.job_type || 'Full-time, Permanent');
        this.setTxt('prefLocation', p.preferred_location || 'Bengaluru, Remote, Hyderabad');
        this.setTxt('prefAnnualSalary', p.annual_salary || '₹14,00,000 / yr');
        this.setTxt('prefExpectedSalary', p.expected_salary || '₹18,00,000 - ₹22,00,000 / yr');

        // 9. Tab 7: Security & Google Sync (Google Account style)
        const toggle2fa = document.getElementById('toggle2faCheckbox');
        if (toggle2fa) toggle2fa.checked = !!p.two_factor_enabled;
        const authProviderBadge = document.getElementById('authProviderBadge');
        if (authProviderBadge) {
            authProviderBadge.textContent = p.auth_provider === 'google' ? 'Google Account Connected' : 'Email & Password Auth';
        }

        // 10. Sidebar Widgets: Interview Intelligence & Stats
        const stats = p.interview_stats || { avg_overall_score: 84, avg_technical_score: 87, avg_hr_score: 80, total_questions_solved: 18, readiness_rating: 'Top 10% Ready' };
        this.setTxt('statsAvgOverall', `${stats.avg_overall_score || 84}%`);
        this.setTxt('statsAvgTech', `${stats.avg_technical_score || 87}%`);
        this.setTxt('statsAvgHr', `${stats.avg_hr_score || 80}%`);
        this.setTxt('statsQuestionsSolved', stats.total_questions_solved || 18);
        this.setTxt('statsReadinessPill', stats.readiness_rating || 'Top 10% Ready');

        // Render slots & history
        this.renderBookedSlots();
        this.renderHistory();
    },

    renderSkills() {
        const p = this.currentProfile;
        if (!p) return;

        const techContainer = document.getElementById('technicalSkillsList');
        const softContainer = document.getElementById('softSkillsList');

        if (techContainer) {
            techContainer.innerHTML = '';
            (p.skills_list || []).forEach((skill) => {
                const chip = document.createElement('span');
                chip.className = 'skill-chip';
                chip.innerHTML = `
                    <span>${skill}</span>
                    <button type="button" class="skill-chip-delete" title="Remove ${skill}"><i class="fa-solid fa-xmark"></i></button>
                `;
                chip.querySelector('.skill-chip-delete').addEventListener('click', () => {
                    this.removeSkill(skill);
                });
                techContainer.appendChild(chip);
            });
        }

        if (softContainer) {
            softContainer.innerHTML = '';
            (p.soft_skills_list || []).forEach((skill) => {
                const chip = document.createElement('span');
                chip.className = 'skill-chip soft-skill-chip';
                chip.innerHTML = `<span><i class="fa-solid fa-check"></i> ${skill}</span>`;
                softContainer.appendChild(chip);
            });
        }
    },

    async addSkill(skillName) {
        const clean = (skillName || '').trim();
        if (!clean) return;

        const p = this.currentProfile;
        if (!p.skills_list) p.skills_list = [];
        if (p.skills_list.includes(clean)) {
            window.showToast?.('Skill already in your profile.', 'info');
            return;
        }

        p.skills_list.push(clean);
        this.renderSkills();

        const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('interviewai_token');
        if (token) {
            try {
                await fetch('/api/profile/skills', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ skill: clean })
                });
            } catch (err) {
                console.warn('[Profile] Failed to save skill to server:', err);
            }
        }
        window.showToast?.(`Added "${clean}" to Technical Skills.`, 'success');
    },

    async removeSkill(skillName) {
        const clean = (skillName || '').trim();
        const p = this.currentProfile;
        if (!p || !p.skills_list) return;

        p.skills_list = p.skills_list.filter(s => s.toLowerCase() !== clean.toLowerCase());
        this.renderSkills();

        const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('interviewai_token');
        if (token) {
            try {
                await fetch(`/api/profile/skills/${encodeURIComponent(clean)}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (err) {
                console.warn('[Profile] Failed to remove skill on server:', err);
            }
        }
        window.showToast?.(`Removed "${clean}".`, 'info');
    },

    renderExperience() {
        const container = document.getElementById('experienceTimelineList');
        if (!container) return;
        container.innerHTML = '';

        const exps = this.currentProfile?.work_experience || [];
        if (exps.length === 0) {
            container.innerHTML = '<p class="text-muted p-3">No employment history added yet. Click "+ Add Employment" to get started.</p>';
            return;
        }

        exps.forEach((exp) => {
            const item = document.createElement('div');
            item.className = 'timeline-item card-subtle';
            item.innerHTML = `
                <div class="timeline-item-header">
                    <div>
                        <h4 class="timeline-role">${exp.job_title}</h4>
                        <div class="timeline-sub">
                            <span class="timeline-company"><i class="fa-solid fa-building"></i> ${exp.company}</span>
                            ${exp.location ? `<span class="timeline-loc"><i class="fa-solid fa-location-dot"></i> ${exp.location}</span>` : ''}
                        </div>
                    </div>
                    <div class="timeline-actions">
                        <span class="timeline-dates badge-pill-sm">${exp.start_date || ''} - ${exp.end_date || 'Present'}</span>
                        <button type="button" class="btn btn-sm btn-ghost text-danger delete-exp-btn" title="Delete experience">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="timeline-desc">${exp.description || ''}</p>
            `;
            item.querySelector('.delete-exp-btn').addEventListener('click', () => {
                this.deleteExperience(exp.id);
            });
            container.appendChild(item);
        });
    },

    async deleteExperience(expId) {
        const p = this.currentProfile;
        if (!p) return;
        p.work_experience = (p.work_experience || []).filter(e => e.id !== expId);
        this.renderExperience();

        const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('interviewai_token');
        if (token && expId) {
            try {
                await fetch(`/api/profile/experience/${expId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (err) {}
        }
        window.showToast?.('Work experience removed.', 'info');
    },

    renderEducation() {
        const container = document.getElementById('educationCardsList');
        if (!container) return;
        container.innerHTML = '';

        const edus = this.currentProfile?.education || [];
        if (edus.length === 0) {
            container.innerHTML = '<p class="text-muted p-3">No education records added yet. Click "+ Add Education" to add your degree.</p>';
            return;
        }

        edus.forEach((edu) => {
            const card = document.createElement('div');
            card.className = 'education-card card-subtle';
            card.innerHTML = `
                <div class="edu-top">
                    <div>
                        <h4 class="edu-degree">${edu.degree_title}</h4>
                        <span class="edu-institution"><i class="fa-solid fa-building-columns"></i> ${edu.institution}</span>
                    </div>
                    <button type="button" class="btn btn-sm btn-ghost text-danger delete-edu-btn" title="Delete record">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
                <div class="edu-footer">
                    <span class="edu-years"><i class="fa-regular fa-calendar"></i> ${edu.start_year ? edu.start_year + ' - ' : ''}${edu.end_year || ''}</span>
                    <span class="edu-grade badge-success-sm">${edu.grade_or_honors || 'Degree Completed'}</span>
                </div>
            `;
            card.querySelector('.delete-edu-btn').addEventListener('click', () => {
                this.deleteEducation(edu.id);
            });
            container.appendChild(card);
        });
    },

    async deleteEducation(eduId) {
        const p = this.currentProfile;
        if (!p) return;
        p.education = (p.education || []).filter(e => e.id !== eduId);
        this.renderEducation();

        const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('interviewai_token');
        if (token && eduId) {
            try {
                await fetch(`/api/profile/education/${eduId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (err) {}
        }
        window.showToast?.('Education record removed.', 'info');
    },

    renderProjects() {
        const container = document.getElementById('projectsCardsList');
        if (!container) return;
        container.innerHTML = '';

        const projs = this.currentProfile?.projects || [];
        if (projs.length === 0) {
            container.innerHTML = '<p class="text-muted p-3">No highlighted projects added yet. Click "+ Add Project" to showcase your architectural accomplishments.</p>';
            return;
        }

        projs.forEach((proj) => {
            const card = document.createElement('div');
            card.className = 'project-card card-subtle';
            card.innerHTML = `
                <div>
                    <div class="proj-header">
                        <h4 class="proj-title">${proj.title}</h4>
                        <button type="button" class="btn btn-sm btn-ghost text-danger delete-proj-btn" title="Delete project">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                    <div class="proj-role-stack">
                        ${proj.role ? `<span class="proj-role-badge"><i class="fa-solid fa-user-tag"></i> ${proj.role}</span>` : ''}
                        <span class="proj-stack"><i class="fa-solid fa-microchip"></i> ${proj.tech_stack || ''}</span>
                    </div>
                    <p class="proj-desc">${proj.description || ''}</p>
                </div>
                <div class="proj-links">
                    ${proj.github_url ? `<a href="${proj.github_url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline"><i class="fa-brands fa-github"></i> Code</a>` : ''}
                    ${proj.project_url ? `<a href="${proj.project_url}" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary"><i class="fa-solid fa-arrow-up-right-from-square"></i> Live Demo</a>` : ''}
                </div>
            `;
            card.querySelector('.delete-proj-btn').addEventListener('click', () => {
                this.deleteProject(proj.id);
            });
            container.appendChild(card);
        });
    },

    async deleteProject(projId) {
        const p = this.currentProfile;
        if (!p) return;
        p.projects = (p.projects || []).filter(pr => pr.id !== projId);
        this.renderProjects();

        const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('interviewai_token');
        if (token && projId) {
            try {
                await fetch(`/api/profile/projects/${projId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (err) {}
        }
        window.showToast?.('Project item removed.', 'info');
    },

    renderBookedSlots() {
        const container = document.getElementById('bookedSlotsList');
        if (!container) return;
        container.innerHTML = '';

        const slots = this.currentProfile?.booked_slots || [];
        if (slots.length === 0) {
            container.innerHTML = '<p class="text-muted p-2">No upcoming mock interviews scheduled. Click "+ Book Slot" to schedule.</p>';
            return;
        }

        slots.forEach(slot => {
            const el = document.createElement('div');
            el.className = 'slot-card-item card-subtle';
            el.innerHTML = `
                <div class="slot-info">
                    <strong>${slot.title || 'Technical Mock Interview'}</strong>
                    <span class="slot-time"><i class="fa-regular fa-clock"></i> ${slot.slot_date} at ${slot.slot_time}</span>
                    <span class="slot-interviewer text-muted"><i class="fa-solid fa-robot"></i> ${slot.interviewer_type || 'AI Interviewer'}</span>
                </div>
                <button type="button" class="btn btn-sm btn-ghost text-danger cancel-slot-btn" title="Cancel slot">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            el.querySelector('.cancel-slot-btn').addEventListener('click', () => {
                this.cancelSlot(slot.id);
            });
            container.appendChild(el);
        });
    },

    renderHistory() {
        const container = document.getElementById('profileInterviewHistoryList');
        if (!container) return;
        container.innerHTML = '';

        const history = this.currentProfile?.interview_history || [];
        if (history.length === 0) {
            container.innerHTML = '<p class="text-muted p-2">No past interview sessions yet. Launch your first mock session from the Mock Room!</p>';
            return;
        }

        history.slice(0, 3).forEach(item => {
            const row = document.createElement('div');
            row.className = 'history-item-card card-subtle';
            row.innerHTML = `
                <div class="history-item-top">
                    <div>
                        <strong>${item.role}</strong>
                        <span class="text-muted d-block" style="font-size:0.75rem;">${item.created_at || 'Recent'}</span>
                    </div>
                    <div class="history-score-pill ${item.overall_score >= 80 ? 'score-high' : 'score-mid'}">
                        ${item.overall_score || 0}%
                    </div>
                </div>
                <div class="history-rubrics">
                    <span>Tech: <strong>${item.technical_score || 0}%</strong></span>
                    <span>HR: <strong>${item.hr_score || 0}%</strong></span>
                </div>
            `;
            container.appendChild(row);
        });
    },

    async saveProfileUpdates(patchData) {
        const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('interviewai_token');
        if (token) {
            try {
                const res = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(patchData)
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.profile) {
                        this.currentProfile = data.profile;
                        this.renderProfile();
                        window.showToast?.('Candidate profile saved to database.', 'success');
                        return;
                    }
                }
            } catch (err) {
                console.warn('[Profile] Failed to update server profile:', err);
            }
        }

        // Local merge fallback
        Object.assign(this.currentProfile, patchData);
        this.renderProfile();
        window.showToast?.('Profile updated locally.', 'info');
    },

    async handleResumeUpload(file) {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            window.showToast?.('Resume file exceeds 5MB size limit.', 'error');
            return;
        }

        window.showToast?.('Uploading resume and extracting technical profile...', 'info');
        const reader = new FileReader();
        reader.onload = async () => {
            const base64Content = reader.result;
            const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('interviewai_token');

            try {
                const res = await fetch('/api/profile/resume', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        filename: file.name,
                        file_base64: base64Content
                    })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Resume upload failed');

                if (data.profile) {
                    this.currentProfile = data.profile;
                    this.renderProfile();
                } else {
                    this.currentProfile.resume_filename = file.name;
                    this.currentProfile.resume_uploaded_at = new Date().toLocaleString();
                    this.renderProfile();
                }
                window.showToast?.('Resume uploaded and technical skills extracted!', 'success');
            } catch (err) {
                window.showToast?.(err.message, 'error');
            }
        };
        reader.readAsDataURL(file);
    },

    async cancelSlot(slotId) {
        const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('interviewai_token');
        if (token && slotId) {
            try {
                await fetch(`/api/profile/booked-slots/${slotId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) {}
        }
        this.currentProfile.booked_slots = (this.currentProfile.booked_slots || []).filter(s => s.id !== slotId);
        this.renderBookedSlots();
        window.showToast?.('Mock slot cancelled.', 'info');
    },

    initEventListeners() {
        // Tab switching
        const tabBtns = document.querySelectorAll('.profile-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.profile-panel').forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const targetTab = btn.getAttribute('data-tab');
                const panel = document.getElementById(targetTab);
                if (panel) panel.classList.add('active');
            });
        });

        // Quick Info Modal
        const editQuickModal = document.getElementById('editQuickModal');
        document.getElementById('openEditQuickModalBtn')?.addEventListener('click', () => {
            const p = this.currentProfile || {};
            this.setVal('editNameInput', p.name);
            this.setVal('editPhoneInput', p.phone);
            this.setVal('editTitleInput', p.professional_title);
            this.setVal('editCompanyInput', p.current_company);
            this.setVal('editTotalExpInput', p.total_experience);
            this.setVal('editLocationInput', p.location);
            this.setVal('editNoticePeriodSelect', p.notice_period || '15 Days');
            this.setVal('editAnnualSalaryInput', p.annual_salary);
            this.setVal('editExpectedSalaryInput', p.expected_salary);
            editQuickModal?.showModal();
        });
        document.getElementById('closeEditQuickModalBtn')?.addEventListener('click', () => editQuickModal?.close());
        document.getElementById('cancelEditQuickBtn')?.addEventListener('click', () => editQuickModal?.close());
        document.getElementById('editQuickForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfileUpdates({
                name: document.getElementById('editNameInput')?.value,
                phone: document.getElementById('editPhoneInput')?.value,
                professional_title: document.getElementById('editTitleInput')?.value,
                current_company: document.getElementById('editCompanyInput')?.value,
                total_experience: document.getElementById('editTotalExpInput')?.value,
                location: document.getElementById('editLocationInput')?.value,
                notice_period: document.getElementById('editNoticePeriodSelect')?.value,
                annual_salary: document.getElementById('editAnnualSalaryInput')?.value,
                expected_salary: document.getElementById('editExpectedSalaryInput')?.value
            });
            editQuickModal?.close();
        });

        // Inline Add Skill button & input (NO prompt popup!)
        const inlineSkillInput = document.getElementById('inlineSkillInput');
        const inlineAddSkillBtn = document.getElementById('inlineAddSkillBtn');
        const doAddSkill = () => {
            if (inlineSkillInput && inlineSkillInput.value.trim()) {
                this.addSkill(inlineSkillInput.value.trim());
                inlineSkillInput.value = '';
            }
        };
        inlineAddSkillBtn?.addEventListener('click', doAddSkill);
        inlineSkillInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                doAddSkill();
            }
        });

        // Edit Headline Modal
        const headlineModal = document.getElementById('editHeadlineModal');
        document.getElementById('editHeadlineBtn')?.addEventListener('click', () => {
            this.setVal('editHeadlineInput', this.currentProfile?.resume_headline);
            headlineModal?.showModal();
        });
        document.getElementById('closeHeadlineModalBtn')?.addEventListener('click', () => headlineModal?.close());
        document.getElementById('cancelHeadlineBtn')?.addEventListener('click', () => headlineModal?.close());
        document.getElementById('editHeadlineForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfileUpdates({ resume_headline: document.getElementById('editHeadlineInput')?.value });
            headlineModal?.close();
        });

        // Add Experience Modal
        const addExpModal = document.getElementById('addExpModal');
        document.getElementById('openAddExpModalBtn')?.addEventListener('click', () => {
            document.getElementById('addExpForm')?.reset();
            addExpModal?.showModal();
        });
        document.getElementById('closeAddExpModalBtn')?.addEventListener('click', () => addExpModal?.close());
        document.getElementById('cancelAddExpBtn')?.addEventListener('click', () => addExpModal?.close());
        document.getElementById('addExpForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                job_title: document.getElementById('expTitleInput')?.value,
                company: document.getElementById('expCompanyInput')?.value,
                location: document.getElementById('expLocationInput')?.value || '',
                start_date: document.getElementById('expStartInput')?.value || '',
                end_date: document.getElementById('expEndInput')?.value || 'Present',
                is_current: document.getElementById('expCurrentCheckbox')?.checked ? true : false,
                description: document.getElementById('expDescInput')?.value || ''
            };

            const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('interviewai_token');
            if (token) {
                try {
                    const res = await fetch('/api/profile/experience', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.item) {
                            if (!this.currentProfile.work_experience) this.currentProfile.work_experience = [];
                            this.currentProfile.work_experience.unshift(data.item);
                            this.renderExperience();
                            addExpModal?.close();
                            window.showToast?.('Work experience added.', 'success');
                            return;
                        }
                    }
                } catch (err) {}
            }

            if (!this.currentProfile.work_experience) this.currentProfile.work_experience = [];
            this.currentProfile.work_experience.unshift({ id: Date.now(), ...payload });
            this.renderExperience();
            addExpModal?.close();
            window.showToast?.('Work experience added.', 'success');
        });

        // Add Education Modal
        const addEduModal = document.getElementById('addEduModal');
        document.getElementById('openAddEduModalBtn')?.addEventListener('click', () => {
            document.getElementById('addEduForm')?.reset();
            addEduModal?.showModal();
        });
        document.getElementById('closeAddEduModalBtn')?.addEventListener('click', () => addEduModal?.close());
        document.getElementById('cancelAddEduBtn')?.addEventListener('click', () => addEduModal?.close());
        document.getElementById('addEduForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                degree_title: document.getElementById('eduDegreeInput')?.value,
                institution: document.getElementById('eduInstitutionInput')?.value,
                field_of_study: document.getElementById('eduFieldInput')?.value || '',
                start_year: document.getElementById('eduStartYearInput')?.value || '',
                end_year: document.getElementById('eduYearInput')?.value || '',
                grade_or_honors: document.getElementById('eduGradeInput')?.value || ''
            };

            const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('interviewai_token');
            if (token) {
                try {
                    const res = await fetch('/api/profile/education', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.item) {
                            if (!this.currentProfile.education) this.currentProfile.education = [];
                            this.currentProfile.education.push(data.item);
                            this.renderEducation();
                            addEduModal?.close();
                            window.showToast?.('Education record saved.', 'success');
                            return;
                        }
                    }
                } catch (err) {}
            }

            if (!this.currentProfile.education) this.currentProfile.education = [];
            this.currentProfile.education.push({ id: Date.now(), ...payload });
            this.renderEducation();
            addEduModal?.close();
            window.showToast?.('Education record added.', 'success');
        });

        // Add Project Modal
        const addProjModal = document.getElementById('addProjModal');
        document.getElementById('openAddProjModalBtn')?.addEventListener('click', () => {
            document.getElementById('addProjForm')?.reset();
            addProjModal?.showModal();
        });
        document.getElementById('closeAddProjModalBtn')?.addEventListener('click', () => addProjModal?.close());
        document.getElementById('cancelAddProjBtn')?.addEventListener('click', () => addProjModal?.close());
        document.getElementById('addProjForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                title: document.getElementById('projTitleInput')?.value,
                tech_stack: document.getElementById('projStackInput')?.value || '',
                role: document.getElementById('projRoleInput')?.value || 'Developer',
                description: document.getElementById('projDescInput')?.value || '',
                github_url: document.getElementById('projGithubInput')?.value || '',
                project_url: document.getElementById('projDemoInput')?.value || ''
            };

            const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('interviewai_token');
            if (token) {
                try {
                    const res = await fetch('/api/profile/projects', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.item) {
                            if (!this.currentProfile.projects) this.currentProfile.projects = [];
                            this.currentProfile.projects.push(data.item);
                            this.renderProjects();
                            addProjModal?.close();
                            window.showToast?.('Project item saved.', 'success');
                            return;
                        }
                    }
                } catch (err) {}
            }

            if (!this.currentProfile.projects) this.currentProfile.projects = [];
            this.currentProfile.projects.push({ id: Date.now(), ...payload });
            this.renderProjects();
            addProjModal?.close();
            window.showToast?.('Project item added.', 'success');
        });

        // Book Slot Modal
        const bookSlotModal = document.getElementById('bookSlotModal');
        document.getElementById('openBookSlotModalBtn')?.addEventListener('click', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            this.setVal('slotDateInput', tomorrow.toISOString().split('T')[0]);
            this.setVal('slotTimeInput', '14:30');
            bookSlotModal?.showModal();
        });
        document.getElementById('closeBookSlotModalBtn')?.addEventListener('click', () => bookSlotModal?.close());
        document.getElementById('cancelBookSlotBtn')?.addEventListener('click', () => bookSlotModal?.close());
        document.getElementById('bookSlotForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const slotData = {
                title: document.getElementById('slotTitleInput')?.value || 'Technical Mock Interview',
                role: document.getElementById('slotRoleInput')?.value || 'Software Engineer',
                slot_date: document.getElementById('slotDateInput')?.value,
                slot_time: document.getElementById('slotTimeInput')?.value,
                interviewer_type: document.getElementById('slotTypeSelect')?.value || 'AI Technical Interviewer',
                notes: document.getElementById('slotNotesInput')?.value || ''
            };

            const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('interviewai_token');
            if (token) {
                try {
                    const res = await fetch('/api/profile/booked-slots', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(slotData)
                    });
                    if (res.ok) {
                        const data = await res.json();
                        if (data.slot) {
                            if (!this.currentProfile.booked_slots) this.currentProfile.booked_slots = [];
                            this.currentProfile.booked_slots.push(data.slot);
                            this.renderBookedSlots();
                            bookSlotModal?.close();
                            window.showToast?.('Mock interview slot confirmed!', 'success');
                            return;
                        }
                    }
                } catch (err) {}
            }

            if (!this.currentProfile.booked_slots) this.currentProfile.booked_slots = [];
            this.currentProfile.booked_slots.push({ id: Date.now(), ...slotData, status: 'Confirmed' });
            this.renderBookedSlots();
            bookSlotModal?.close();
            window.showToast?.('Mock interview slot reserved.', 'success');
        });

        // Resume file upload triggers
        const triggerUpload = () => document.getElementById('inlineResumeFileInput')?.click();
        document.getElementById('triggerResumeUploadBtn')?.addEventListener('click', triggerUpload);
        document.getElementById('inlineResumeFileInput')?.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                this.handleResumeUpload(e.target.files[0]);
            }
        });

        // 2FA Toggle
        document.getElementById('toggle2faCheckbox')?.addEventListener('change', async (e) => {
            const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('interviewai_token');
            if (token) {
                try {
                    const res = await fetch('/api/profile/toggle-2fa', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const d = await res.json();
                    window.showToast?.(`Two-Factor Authentication ${d.two_factor_enabled ? 'Enabled' : 'Disabled'}.`, 'info');
                } catch (err) {}
            }
        });

        // Password Change
        document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPwd = document.getElementById('newPasswordInput')?.value;
            const confirmPwd = document.getElementById('confirmPasswordInput')?.value;

            if (!newPwd || newPwd.length < 6) {
                window.showToast?.('Password must be at least 6 characters.', 'error');
                return;
            }
            if (newPwd !== confirmPwd) {
                window.showToast?.('Passwords do not match.', 'error');
                return;
            }

            const token = window.Auth ? window.Auth.getToken() : localStorage.getItem('interviewai_token');
            if (token) {
                try {
                    const res = await fetch('/api/profile/change-password', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ new_password: newPwd })
                    });
                    if (res.ok) {
                        window.showToast?.('Password successfully updated!', 'success');
                        document.getElementById('changePasswordForm')?.reset();
                    } else {
                        const d = await res.json();
                        window.showToast?.(d.detail || 'Password update failed.', 'error');
                    }
                } catch (err) {
                    window.showToast?.(err.message, 'error');
                }
            } else {
                window.showToast?.('Please log in to change password.', 'warning');
            }
        });

        // Avatar change trigger
        document.getElementById('changeAvatarBtn')?.addEventListener('click', () => {
            const currentName = this.currentProfile?.name || 'Candidate';
            const colors = ['4f46e5', '06b6d4', '10b981', 'ec4899', 'f59e0b', '8b5cf6'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const newAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentName)}&background=${randomColor}&color=fff&size=160`;
            this.saveProfileUpdates({ avatar_url: newAvatar });
        });
    }
};

window.Profile = Profile;
