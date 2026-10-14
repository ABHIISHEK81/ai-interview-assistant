/**
 * Billing Module: Tier Management (₹99, ₹129, ₹199), UPI QR Verification, and Returning User Gate.
 */
const Billing = {
    selectedPlan: {
        id: 'medium_129',
        name: 'Pro Mastery',
        tier: 'Medium Tier',
        price: 129,
        perks: [
            'Unlimited AI Resume ATS Scans',
            '10 Adaptive AI Mock Interviews',
            'Real-time Voice Dictation & Audio Readout',
            'Naukri-Optimized Profile Boost & PDF Export',
            'Downloadable Performance Diagnostic'
        ]
    },

    plansData: {
        'low_99': {
            id: 'low_99',
            name: 'Starter Prep',
            tier: 'Low Tier',
            price: 99,
            perks: [
                '5 Comprehensive Resume ATS Scans',
                '3 Complete Adaptive Mock Interviews',
                'Instant Rubric Scoring & Breakdown',
                'Keyword Gap Diagnostics',
                'Naukri Profile Scorecard'
            ]
        },
        'medium_129': {
            id: 'medium_129',
            name: 'Pro Mastery',
            tier: 'Medium Tier (Recommended)',
            price: 129,
            perks: [
                'Unlimited AI Resume ATS Scans',
                '10 Adaptive AI Mock Interviews',
                'Real-time Voice Dictation & Audio Readout',
                'Naukri-Optimized Profile Boost',
                'Downloadable Performance Diagnostic'
            ]
        },
        'high_199': {
            id: 'high_199',
            name: 'Ultimate Lifetime Pass',
            tier: 'High Tier (VIP)',
            price: 199,
            perks: [
                'Lifetime Unlimited Mock Interviews',
                'Custom Role & Job Description Simulation',
                'System Design & Lead Engineer Questions',
                'Priority Gemini Flash AI Processing',
                '1-on-1 AI Technical Interview Scheduling'
            ]
        }
    },

    openPaymentModal(planId = 'medium_129') {
        const plan = this.plansData[planId] || this.plansData['medium_129'];
        this.selectedPlan = plan;

        const modal = document.getElementById('paymentModal');
        if (!modal) return;

        document.getElementById('modalPlanBadge').textContent = plan.tier;
        document.getElementById('modalPlanName').textContent = plan.name;
        document.getElementById('modalPlanPrice').textContent = `₹${plan.price}`;

        const perksList = document.getElementById('modalPlanPerks');
        if (perksList) {
            perksList.innerHTML = plan.perks.map(p => `<li><i class="fa-solid fa-circle-check text-success"></i> ${p}</li>`).join('');
        }

        const utrInput = document.getElementById('utrNumberInput');
        if (utrInput) utrInput.value = '';

        modal.showModal();
    },

    closePaymentModal() {
        const modal = document.getElementById('paymentModal');
        if (modal) modal.close();
    },

    async verifyPayment(utrNumber) {
        if (!utrNumber || utrNumber.trim().length < 6) {
            showToast('Please enter a valid 12-digit UPI UTR / Reference number.', 'error');
            return;
        }

        const token = Auth.getToken();
        const payload = {
            plan_tier: this.selectedPlan.id,
            amount_inr: this.selectedPlan.price,
            utr_number: utrNumber.trim()
        };

        try {
            showToast('Verifying UPI payment with bank gateway...', 'info');
            const res = await fetch('/api/billing/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Verification failed.');

            this.closePaymentModal();
            showToast(`Payment of ₹${this.selectedPlan.price} verified! ${this.selectedPlan.name} is now ACTIVE!`, 'success');

            // Update local user and profile state
            if (data.profile) {
                if (window.Profile) {
                    window.Profile.currentProfile = data.profile;
                    window.Profile.renderProfile();
                }
                const user = Auth.getUser() || {};
                user.is_subscribed = 1;
                user.subscription_tier = this.selectedPlan.id;
                Auth.setSession(token, user);
            }
        } catch (err) {
            showToast(err.message, 'error');
        }
    },

    initEventListeners() {
        // Plan select buttons
        document.querySelectorAll('.select-plan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planId = e.currentTarget.getAttribute('data-plan') || 'medium_129';
                this.openPaymentModal(planId);
            });
        });

        // Quick upgrade button in sticky bar and profile sidebar
        document.getElementById('quickUpgradeBtn')?.addEventListener('click', () => {
            this.openPaymentModal('medium_129');
        });
        document.getElementById('sidebarUpgradeBtn')?.addEventListener('click', () => {
            this.openPaymentModal('medium_129');
        });

        // Close payment modal
        document.getElementById('closePaymentModalBtn')?.addEventListener('click', () => {
            this.closePaymentModal();
        });

        // Form submission for UTR verification
        document.getElementById('verifyPaymentForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const utr = document.getElementById('utrNumberInput').value;
            this.verifyPayment(utr);
        });
    }
};

window.Billing = Billing;
