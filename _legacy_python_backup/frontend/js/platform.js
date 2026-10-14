/**
 * InterviewAI Platform Module
 * Manages Technical Interview Masterclasses (Videos) & Interactive Mock Test Arena.
 */
const Platform = {
    videos: [],
    tests: [],
    activeVideoFilter: 'all',
    activeTestFilter: 'all',

    // Active Mock Test State
    activeTest: null,
    currentQuestionIdx: 0,
    selectedAnswers: {}, // question_id -> chosen option index
    testTimerInterval: null,
    remainingSeconds: 0,
    timeSpentSeconds: 0,

    async init() {
        console.log('[Platform] Initializing Video Masterclasses & Mock Test Arena...');
        this.initEventListeners();
        await Promise.all([
            this.loadVideos(),
            this.loadMockTests(),
        ]);
    },

    initEventListeners() {
        // Video Filter Buttons
        document.querySelectorAll('.video-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.video-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeVideoFilter = btn.dataset.filter || 'all';
                this.renderVideos();
            });
        });

        // Mock Test Filter Buttons
        document.querySelectorAll('.test-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.test-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeTestFilter = btn.dataset.filter || 'all';
                this.renderMockTests();
            });
        });

        // Close Video Modal
        document.getElementById('closeVideoModalBtn')?.addEventListener('click', () => {
            this.closeVideoModal();
        });

        // Close Mock Test Modal
        document.getElementById('closeMockTestModalBtn')?.addEventListener('click', () => {
            this.confirmCloseMockTest();
        });

        // Mock Test Navigation Buttons
        document.getElementById('testPrevBtn')?.addEventListener('click', () => {
            if (this.currentQuestionIdx > 0) {
                this.currentQuestionIdx--;
                this.renderActiveQuestion();
            }
        });

        document.getElementById('testNextBtn')?.addEventListener('click', () => {
            if (this.activeTest && this.currentQuestionIdx < this.activeTest.questions.length - 1) {
                this.currentQuestionIdx++;
                this.renderActiveQuestion();
            }
        });

        document.getElementById('testSubmitBtn')?.addEventListener('click', () => {
            this.submitActiveMockTest();
        });

        document.getElementById('scorecardRetakeBtn')?.addEventListener('click', () => {
            if (this.activeTest) {
                this.startMockTest(this.activeTest.id);
            }
        });

        document.getElementById('scorecardProfileBtn')?.addEventListener('click', () => {
            const modal = document.getElementById('mockTestModal');
            if (modal?.open) modal.close();
            const profileSection = document.getElementById('profile');
            if (profileSection) {
                profileSection.scrollIntoView({ behavior: 'smooth' });
                if (window.Profile) {
                    Profile.loadProfile();
                }
            }
        });

        // Keyboard navigation during mock test
        window.addEventListener('keydown', (e) => {
            const modal = document.getElementById('mockTestModal');
            if (!modal || !modal.open || !this.activeTest) return;

            // 1, 2, 3, 4 or A, B, C, D to pick options
            const key = e.key.toUpperCase();
            const keyMap = { '1': 0, 'A': 0, '2': 1, 'B': 1, '3': 2, 'C': 2, '4': 3, 'D': 3 };
            if (key in keyMap) {
                const optIdx = keyMap[key];
                this.selectOption(optIdx);
            } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
                if (this.currentQuestionIdx < this.activeTest.questions.length - 1) {
                    this.currentQuestionIdx++;
                    this.renderActiveQuestion();
                }
            } else if (e.key === 'ArrowLeft') {
                if (this.currentQuestionIdx > 0) {
                    this.currentQuestionIdx--;
                    this.renderActiveQuestion();
                }
            }
        });
    },

    // ========================================================
    // VIDEO MASTERCLASSES
    // ========================================================

    async loadVideos() {
        const grid = document.getElementById('videoMasterclassesGrid');
        if (!grid) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/videos`);
            const data = await res.json();
            if (data.success && Array.isArray(data.videos)) {
                this.videos = data.videos;
                this.renderVideos();
            } else {
                grid.innerHTML = '<p class="text-muted">Unable to load masterclasses at this time.</p>';
            }
        } catch (err) {
            console.error('[Platform] Error loading videos:', err);
            grid.innerHTML = '<p class="text-muted">Failed to connect to video repository.</p>';
        }
    },

    renderVideos() {
        const grid = document.getElementById('videoMasterclassesGrid');
        if (!grid) return;

        let filtered = this.videos;
        if (this.activeVideoFilter !== 'all') {
            filtered = this.videos.filter(v => v.category_slug === this.activeVideoFilter);
        }

        if (filtered.length === 0) {
            grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">No masterclasses found for this category.</p>';
            return;
        }

        grid.innerHTML = filtered.map(v => {
            const takeaways = (v.key_takeaways || []).slice(0, 3).map(t => `
                <li class="video-card-takeaway"><i class="fa-solid fa-check text-success"></i> <span>${t}</span></li>
            `).join('');

            return `
                <article class="video-card" data-video-id="${v.id}">
                    <div class="video-thumbnail-box" onclick="Platform.openVideoModal('${v.id}')">
                        <img src="${v.thumbnail}" alt="${v.title}" class="video-thumbnail-img" loading="lazy" onerror="this.src='/assets/video-system-design.jpg'">
                        <div class="video-play-overlay">
                            <span class="video-play-btn"><i class="fa-solid fa-play"></i></span>
                        </div>
                        <span class="video-duration-pill"><i class="fa-regular fa-clock"></i> ${v.duration}</span>
                        <span class="video-level-pill">${v.level}</span>
                    </div>

                    <div class="video-card-body">
                        <div class="video-card-category">${v.category}</div>
                        <h3 class="video-card-title" onclick="Platform.openVideoModal('${v.id}')">${v.title}</h3>
                        <p class="video-card-desc">${v.summary}</p>

                        <ul class="video-takeaways-list">
                            ${takeaways}
                        </ul>

                        <div class="video-card-footer">
                            <div class="video-instructor">
                                <img src="${v.instructor_avatar}" alt="${v.instructor}" class="instructor-avatar">
                                <div class="instructor-info">
                                    <strong class="instructor-name">${v.instructor}</strong>
                                    <span class="instructor-title">${v.instructor_title}</span>
                                </div>
                            </div>
                            <button type="button" class="btn btn-sm btn-primary" onclick="Platform.openVideoModal('${v.id}')">
                                <i class="fa-solid fa-play"></i> Watch
                            </button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    },

    openVideoModal(videoId) {
        const video = this.videos.find(v => v.id === videoId);
        if (!video) return;

        const modal = document.getElementById('videoPlayerModal');
        const container = document.getElementById('videoPlayerModalContainer');
        if (!modal || !container) return;

        const takeaways = (video.key_takeaways || []).map(t => `
            <li class="video-modal-takeaway"><i class="fa-solid fa-circle-check text-accent"></i> <span>${t}</span></li>
        `).join('');

        const bookmarks = (video.timestamp_bookmarks || []).map(b => `
            <button type="button" class="video-bookmark-chip" onclick="Platform.seekVideoTime('${b.time}')">
                <i class="fa-solid fa-bookmark text-warning"></i>
                <span class="bookmark-time">${b.time}</span>
                <span class="bookmark-label">${b.label}</span>
            </button>
        `).join('');

        container.innerHTML = `
            <div class="video-modal-iframe-wrapper">
                <iframe id="masterclassIframe" src="${video.video_url}?autoplay=1&rel=0" title="${video.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            </div>

            <div class="video-modal-details">
                <div class="video-modal-header-row">
                    <div>
                        <div class="badge-pill mb-2"><i class="fa-solid fa-graduation-cap"></i> ${video.category} &bull; ${video.level}</div>
                        <h2 class="video-modal-title">${video.title}</h2>
                    </div>
                    <div class="video-modal-duration-tag">
                        <i class="fa-regular fa-clock"></i> ${video.duration} Full Masterclass
                    </div>
                </div>

                <div class="video-instructor-banner">
                    <img src="${video.instructor_avatar}" alt="${video.instructor}" class="instructor-avatar-lg">
                    <div>
                        <h4 style="margin: 0; color: var(--text-primary);">${video.instructor}</h4>
                        <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${video.instructor_title}</p>
                    </div>
                </div>

                <div class="video-modal-summary-box">
                    <p style="margin: 0; line-height: 1.6; color: var(--text-secondary);">${video.summary}</p>
                </div>

                <!-- Timestamp Bookmarks -->
                <div class="video-bookmarks-section">
                    <h4 class="video-bookmarks-title"><i class="fa-solid fa-list-check"></i> High-Yield Timeline Bookmarks</h4>
                    <div class="video-bookmarks-grid">
                        ${bookmarks}
                    </div>
                </div>

                <!-- Key Takeaways -->
                <div class="video-takeaways-section">
                    <h4 class="video-takeaways-title"><i class="fa-solid fa-award"></i> Architectural Mastery Takeaways</h4>
                    <ul class="video-modal-takeaways-list">
                        ${takeaways}
                    </ul>
                </div>

                <!-- Simulation CTA -->
                <div class="video-modal-cta-box">
                    <div>
                        <h4 style="margin:0 0 0.25rem 0; color:var(--text-primary);">Ready to practice this scenario live?</h4>
                        <p style="margin:0; font-size:0.85rem; color:var(--text-secondary);">Start an adaptive mock interview or take a diagnostic quiz based on this architecture.</p>
                    </div>
                    <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
                        <button type="button" class="btn btn-outline" onclick="Platform.startRelatedMockTest('${video.related_role}')">
                            <i class="fa-solid fa-file-signature"></i> Take Quiz
                        </button>
                        <button type="button" class="btn btn-primary" onclick="Platform.jumpToMockInterview('${video.related_role}')">
                            <i class="fa-solid fa-microphone-lines"></i> Live AI Mock
                        </button>
                    </div>
                </div>
            </div>
        `;

        if (typeof modal.showModal === 'function') {
            modal.showModal();
        } else {
            modal.style.display = 'block';
        }
    },

    closeVideoModal() {
        const modal = document.getElementById('videoPlayerModal');
        const iframe = document.getElementById('masterclassIframe');
        if (iframe) {
            // Stop video playback by removing iframe src
            iframe.src = '';
        }
        if (modal?.open) {
            modal.close();
        } else if (modal) {
            modal.style.display = 'none';
        }
    },

    seekVideoTime(timeStr) {
        showToast(`Jumped to timeline bookmark [${timeStr}]`, 'info');
    },

    jumpToMockInterview(role) {
        this.closeVideoModal();
        const mockSection = document.getElementById('mock-interview');
        if (mockSection) {
            mockSection.scrollIntoView({ behavior: 'smooth' });
            const roleSelect = document.getElementById('interviewRoleSelect');
            if (roleSelect && role) {
                for (let i = 0; i < roleSelect.options.length; i++) {
                    if (roleSelect.options[i].text.toLowerCase().includes(role.toLowerCase().slice(0, 10))) {
                        roleSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }
    },

    startRelatedMockTest(role) {
        this.closeVideoModal();
        const testSection = document.getElementById('mock-tests');
        if (testSection) {
            testSection.scrollIntoView({ behavior: 'smooth' });
        }
    },

    // ========================================================
    // INTERACTIVE MOCK TEST ARENA
    // ========================================================

    async loadMockTests() {
        const grid = document.getElementById('mockTestsGrid');
        if (!grid) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/mock-tests`);
            const data = await res.json();
            if (data.success && Array.isArray(data.tests)) {
                this.tests = data.tests;
                this.renderMockTests();
            } else {
                grid.innerHTML = '<p class="text-muted">Unable to load assessment bank.</p>';
            }
        } catch (err) {
            console.error('[Platform] Error loading mock tests:', err);
            grid.innerHTML = '<p class="text-muted">Failed to connect to assessment service.</p>';
        }
    },

    renderMockTests() {
        const grid = document.getElementById('mockTestsGrid');
        if (!grid) return;

        let filtered = this.tests;
        if (this.activeTestFilter !== 'all') {
            filtered = this.tests.filter(t => t.category.toLowerCase().includes(this.activeTestFilter.toLowerCase()));
        }

        if (filtered.length === 0) {
            grid.innerHTML = '<p class="text-muted" style="grid-column: 1/-1; text-align: center; padding: 2rem;">No diagnostic challenges found for this track.</p>';
            return;
        }

        grid.innerHTML = filtered.map(t => {
            const badges = (t.badges || []).map(b => `<span class="test-badge-chip">${b}</span>`).join('');

            return `
                <article class="mock-test-card" data-test-id="${t.id}">
                    <div class="mock-test-card-header">
                        <div class="mock-test-category-tag"><i class="fa-solid fa-code"></i> ${t.category}</div>
                        <span class="mock-test-difficulty-pill ${t.difficulty.toLowerCase().includes('senior') ? 'diff-advanced' : 'diff-mid'}">${t.difficulty}</span>
                    </div>

                    <h3 class="mock-test-title">${t.title}</h3>
                    <p class="mock-test-desc">${t.description}</p>

                    <div class="mock-test-badges-row">
                        ${badges}
                    </div>

                    <div class="mock-test-meta-grid">
                        <div class="test-meta-box">
                            <span class="meta-label">Questions</span>
                            <span class="meta-val"><i class="fa-solid fa-list-ol text-accent"></i> ${t.questions_count}</span>
                        </div>
                        <div class="test-meta-box">
                            <span class="meta-label">Time Limit</span>
                            <span class="meta-val"><i class="fa-regular fa-clock text-warning"></i> ${t.time_limit_minutes}m</span>
                        </div>
                        <div class="test-meta-box">
                            <span class="meta-label">Pass Score</span>
                            <span class="meta-val"><i class="fa-solid fa-chart-line text-success"></i> ${t.passing_score}%</span>
                        </div>
                    </div>

                    <div class="mock-test-footer">
                        <button type="button" class="btn btn-primary btn-block" onclick="Platform.startMockTest('${t.id}')">
                            <i class="fa-solid fa-play"></i> Launch Assessment
                        </button>
                    </div>
                </article>
            `;
        }).join('');
    },

    startMockTest(testId) {
        const test = this.tests.find(t => t.id === testId);
        if (!test) return;

        this.activeTest = test;
        this.currentQuestionIdx = 0;
        this.selectedAnswers = {};
        this.remainingSeconds = test.time_limit_minutes * 60;
        this.timeSpentSeconds = 0;

        // Switch modal to runner view (hide scorecard)
        document.getElementById('mockTestRunnerView')?.classList.remove('hidden');
        document.getElementById('mockTestScorecardView')?.classList.add('hidden');

        // Render test title and questions
        document.getElementById('testRunnerTitle').textContent = test.title;
        document.getElementById('testRunnerCategory').textContent = `${test.category} • ${test.difficulty}`;

        this.startTimer();
        this.renderActiveQuestion();

        const modal = document.getElementById('mockTestModal');
        if (typeof modal.showModal === 'function') {
            modal.showModal();
        } else {
            modal.style.display = 'block';
        }
    },

    startTimer() {
        if (this.testTimerInterval) clearInterval(this.testTimerInterval);

        const timerEl = document.getElementById('testRunnerTimer');
        const updateTimerDisplay = () => {
            const mins = Math.floor(this.remainingSeconds / 60);
            const secs = this.remainingSeconds % 60;
            const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            if (timerEl) {
                timerEl.textContent = timeStr;
                if (this.remainingSeconds <= 60) {
                    timerEl.classList.add('timer-warning');
                } else {
                    timerEl.classList.remove('timer-warning');
                }
            }
        };

        updateTimerDisplay();

        this.testTimerInterval = setInterval(() => {
            this.remainingSeconds--;
            this.timeSpentSeconds++;
            updateTimerDisplay();

            if (this.remainingSeconds <= 0) {
                clearInterval(this.testTimerInterval);
                showToast('Time expired! Automatically submitting your assessment...', 'warning');
                this.submitActiveMockTest();
            }
        }, 1000);
    },

    renderActiveQuestion() {
        if (!this.activeTest) return;
        const questions = this.activeTest.questions;
        const total = questions.length;
        const q = questions[this.currentQuestionIdx];

        // Question count indicator
        const countEl = document.getElementById('testQuestionProgressText');
        if (countEl) countEl.textContent = `Question ${this.currentQuestionIdx + 1} of ${total}`;

        // Progress bar
        const progressBar = document.getElementById('testProgressBar');
        if (progressBar) {
            const pct = Math.round(((this.currentQuestionIdx + 1) / total) * 100);
            progressBar.style.width = `${pct}%`;
        }

        // Render Question prompt
        const promptEl = document.getElementById('testQuestionPrompt');
        if (promptEl) promptEl.textContent = q.question;

        // Render Options
        const container = document.getElementById('testOptionsContainer');
        if (!container) return;

        const currentChoice = this.selectedAnswers[q.id];
        const optionLetters = ['A', 'B', 'C', 'D'];

        container.innerHTML = q.options.map((optText, idx) => {
            const isSelected = currentChoice === idx;
            return `
                <div class="test-option-card ${isSelected ? 'selected' : ''}" onclick="Platform.selectOption(${idx})">
                    <span class="test-option-letter">${optionLetters[idx]}</span>
                    <span class="test-option-text">${optText}</span>
                    <span class="test-option-check"><i class="fa-solid fa-circle-check"></i></span>
                </div>
            `;
        }).join('');

        // Update Prev / Next / Submit buttons
        const prevBtn = document.getElementById('testPrevBtn');
        const nextBtn = document.getElementById('testNextBtn');
        const submitBtn = document.getElementById('testSubmitBtn');

        if (prevBtn) prevBtn.disabled = this.currentQuestionIdx === 0;

        const isLast = this.currentQuestionIdx === total - 1;
        if (nextBtn) nextBtn.style.display = isLast ? 'none' : 'inline-flex';
        if (submitBtn) submitBtn.style.display = isLast ? 'inline-flex' : 'none';

        // Render Question Dots
        this.renderQuestionDots();
    },

    renderQuestionDots() {
        const dotsContainer = document.getElementById('testQuestionsDots');
        if (!dotsContainer || !this.activeTest) return;

        dotsContainer.innerHTML = this.activeTest.questions.map((q, idx) => {
            const isCurrent = idx === this.currentQuestionIdx;
            const isAnswered = this.selectedAnswers[q.id] !== undefined;
            let cls = 'test-dot';
            if (isCurrent) cls += ' active';
            if (isAnswered) cls += ' answered';

            return `
                <button type="button" class="${cls}" onclick="Platform.jumpToQuestion(${idx})" title="Question ${idx + 1}">
                    ${idx + 1}
                </button>
            `;
        }).join('');
    },

    jumpToQuestion(idx) {
        if (this.activeTest && idx >= 0 && idx < this.activeTest.questions.length) {
            this.currentQuestionIdx = idx;
            this.renderActiveQuestion();
        }
    },

    selectOption(optIdx) {
        if (!this.activeTest) return;
        const q = this.activeTest.questions[this.currentQuestionIdx];
        this.selectedAnswers[q.id] = optIdx;
        this.renderActiveQuestion();
    },

    async submitActiveMockTest() {
        if (!this.activeTest) return;

        clearInterval(this.testTimerInterval);

        const totalQuestions = this.activeTest.questions.length;
        const answeredCount = Object.keys(this.selectedAnswers).length;

        if (answeredCount < totalQuestions) {
            const unanswered = totalQuestions - answeredCount;
            if (!confirm(`You have ${unanswered} unanswered question(s). Are you sure you want to finish and submit?`)) {
                this.startTimer();
                return;
            }
        }

        // Show evaluating state
        const submitBtn = document.getElementById('testSubmitBtn');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Evaluating...';
        }

        try {
            const token = localStorage.getItem('interviewai_token') || sessionStorage.getItem('interviewai_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE_URL}/api/mock-tests/evaluate`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    test_id: this.activeTest.id,
                    answers: this.selectedAnswers,
                    time_spent_seconds: this.timeSpentSeconds,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                this.renderScorecard(data);
                showToast(`Assessment submitted! Score: ${data.score_percentage}%`, 'success');
            } else {
                showToast(data.detail || 'Failed to evaluate assessment.', 'error');
            }
        } catch (err) {
            console.error('[Platform] Submit error:', err);
            showToast('Network error while evaluating assessment.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Submit Assessment';
            }
        }
    },

    renderScorecard(result) {
        document.getElementById('mockTestRunnerView')?.classList.add('hidden');
        const scorecardView = document.getElementById('mockTestScorecardView');
        if (!scorecardView) return;
        scorecardView.classList.remove('hidden');

        // Score numbers and readiness
        const scoreRing = document.getElementById('scorecardPctNumber');
        if (scoreRing) scoreRing.textContent = `${result.score_percentage}%`;

        const badgeEl = document.getElementById('scorecardStatusBadge');
        if (badgeEl) {
            if (result.passed) {
                badgeEl.className = 'scorecard-badge badge-passed';
                badgeEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> ASSESSMENT PASSED';
            } else {
                badgeEl.className = 'scorecard-badge badge-retake';
                badgeEl.innerHTML = '<i class="fa-solid fa-rotate-left"></i> RETAKE RECOMMENDED';
            }
        }

        const readinessEl = document.getElementById('scorecardReadinessRating');
        if (readinessEl) readinessEl.textContent = result.readiness_rating;

        const timeSpentEl = document.getElementById('scorecardTimeSpent');
        if (timeSpentEl) {
            const mins = Math.floor(result.time_spent_seconds / 60);
            const secs = result.time_spent_seconds % 60;
            timeSpentEl.textContent = `${mins}m ${secs}s`;
        }

        const correctCountEl = document.getElementById('scorecardCorrectCount');
        if (correctCountEl) correctCountEl.textContent = `${result.correct_count} / ${result.total_questions}`;

        // Detailed Questions Review
        const breakdownContainer = document.getElementById('scorecardBreakdownContainer');
        if (!breakdownContainer) return;

        breakdownContainer.innerHTML = result.detailed_results.map((item, idx) => {
            const isCorrect = item.is_correct;
            const chosenText = item.user_choice !== null ? item.options[item.user_choice] : 'No answer selected';
            const correctText = item.options[item.correct_index];

            return `
                <div class="scorecard-question-item ${isCorrect ? 'item-correct' : 'item-wrong'}">
                    <div class="scorecard-q-header">
                        <span class="scorecard-q-num">Q${idx + 1}</span>
                        <h4 class="scorecard-q-text">${item.question}</h4>
                        <span class="scorecard-verdict ${isCorrect ? 'verdict-pass' : 'verdict-fail'}">
                            <i class="fa-solid ${isCorrect ? 'fa-check' : 'fa-xmark'}"></i> ${isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                    </div>

                    <div class="scorecard-q-answers">
                        <div class="answer-row ${isCorrect ? 'user-correct' : 'user-incorrect'}">
                            <strong>Your Answer:</strong> <span>${chosenText}</span>
                        </div>
                        ${!isCorrect ? `
                            <div class="answer-row correct-answer-highlight">
                                <strong>Correct Architectural Solution:</strong> <span>${correctText}</span>
                            </div>
                        ` : ''}
                    </div>

                    <div class="scorecard-explanation-box">
                        <div class="explanation-title"><i class="fa-solid fa-lightbulb"></i> Engineering Rationale:</div>
                        <p class="explanation-text">${item.explanation}</p>
                    </div>
                </div>
            `;
        }).join('');
    },

    confirmCloseMockTest() {
        if (this.activeTest && this.testTimerInterval) {
            if (confirm('An assessment is currently in progress. Exiting will cancel this session. Are you sure?')) {
                clearInterval(this.testTimerInterval);
                const modal = document.getElementById('mockTestModal');
                if (modal?.open) modal.close();
                else if (modal) modal.style.display = 'none';
            }
        } else {
            const modal = document.getElementById('mockTestModal');
            if (modal?.open) modal.close();
            else if (modal) modal.style.display = 'none';
        }
    }
};

window.Platform = Platform;
