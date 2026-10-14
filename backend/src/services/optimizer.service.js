/**
 * Query Optimizer Service per PDF pp. 270, 520, 1800
 * Rewrites and expands interview queries before retrieval to improve RAG recall
 */

const optimizeQuery = (baseGoal, jobTitle, experienceLevel) => {
  const levelPrefix = experienceLevel ? `${experienceLevel} level ` : '';
  const title = jobTitle || 'Software Engineer';

  if (baseGoal.toLowerCase().includes('skills') || baseGoal.toLowerCase().includes('technical')) {
    return `${levelPrefix}${title} core technical skills, programming languages, system architecture, database design, backend services, frameworks, libraries, tools, and technical project implementations`;
  }

  if (baseGoal.toLowerCase().includes('responsibility') || baseGoal.toLowerCase().includes('qualification')) {
    return `${levelPrefix}${title} primary job responsibilities, required qualifications, daily duties, team collaboration, engineering standards, problem solving, and key deliverables`;
  }

  return `${levelPrefix}${title} ${baseGoal}`;
};

module.exports = {
  optimizeQuery,
};
