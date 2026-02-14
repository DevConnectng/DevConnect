const validateGig = (data) => {
  const errors = [];
  if (!data.title || data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  }
  if (data.title && data.title.length > 200) {
    errors.push('Title too long (max 200)');
  }
  if (data.description && data.description.length > 5000) {
    errors.push('Description too long (max 5000)');
  }
  if (data.budget && !/^[\d\s\-+$,.]+$/.test(data.budget)) {
    errors.push('Budget contains invalid characters');
  }
  if (data.deadline && isNaN(Date.parse(data.deadline))) {
    errors.push('Invalid deadline format');
  }
  return errors;
};

// Validate message
const validateMessage = (text) => {
  if (!text || text.trim().length === 0) return ['Message cannot be empty'];
  if (text.length > 2000) return ['Message too long (max 2000)'];
  return [];
};

// Validate comment
const validateComment = (text) => {
  if (!text || text.trim().length === 0) return ['Comment cannot be empty'];
  if (text.length > 1000) return ['Comment too long (max 1000)'];
  return [];
};

module.exports = {
  validateGig,
  validateMessage,
  validateComment
};
