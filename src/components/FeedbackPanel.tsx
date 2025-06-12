'use client';

import { useState } from 'react';

interface FeedbackPanelProps {
  searchId: string;
  sessionId: string;
  userId?: string;
  onFeedbackSubmitted?: (feedback: any) => void;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  searchId,
  sessionId,
  userId,
  onFeedbackSubmitted,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<'good' | 'bad' | 'needs_improvement' | ''>('');
  const [specificFeedback, setSpecificFeedback] = useState({
    tooManyMales: false,
    tooManyFemales: false,
    wrongNiche: false,
    wrongLocation: false,
    followerCountOff: false,
    notRelevant: false,
    perfectMatch: false,
  });
  const [improvedQuery, setImprovedQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!rating || !feedback) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchId,
          sessionId,
          userId,
          overallRating: rating,
          feedback,
          specificFeedback,
          improvedQuery: improvedQuery || undefined,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSubmitted(true);
        onFeedbackSubmitted?.(result);
        console.log('📝 Feedback submitted successfully:', result);
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFeedback = async (quickRating: number, quickFeedback: 'good' | 'bad') => {
    setRating(quickRating);
    setFeedback(quickFeedback);
    
    // Auto-submit quick feedback
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchId,
          sessionId,
          userId,
          overallRating: quickRating,
          feedback: quickFeedback,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSubmitted(true);
        onFeedbackSubmitted?.(result);
        console.log('📝 Quick feedback submitted:', result);
      }
    } catch (error) {
      console.error('Error submitting quick feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 text-green-700">
          <span className="text-lg">👍</span>
          <span className="font-medium">Thanks for your feedback!</span>
        </div>
        <p className="text-green-600 text-sm mt-1">
          Your input helps us improve search results for everyone.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
      {!isOpen ? (
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg">💬</span>
              <span className="text-gray-700 font-medium">How were these results?</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleQuickFeedback(5, 'good')}
                className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                disabled={isSubmitting}
              >
                <span>👍</span>
                <span className="text-sm">Good</span>
              </button>
              <button
                onClick={() => handleQuickFeedback(2, 'bad')}
                className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                disabled={isSubmitting}
              >
                <span>👎</span>
                <span className="text-sm">Bad</span>
              </button>
              <button
                onClick={() => setIsOpen(true)}
                className="px-3 py-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Detailed feedback
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Help us improve your search results</h3>
          
          {/* Star Rating */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Overall rating
            </label>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`p-1 text-2xl ${rating >= star ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* General Feedback */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              General feedback
            </label>
            <div className="flex space-x-3">
              {[
                { value: 'good', label: 'Good results', color: 'green' },
                { value: 'needs_improvement', label: 'Needs improvement', color: 'yellow' },
                { value: 'bad', label: 'Poor results', color: 'red' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFeedback(option.value as any)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    feedback === option.value
                      ? `bg-${option.color}-100 border-${option.color}-300 text-${option.color}-700`
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Specific Issues */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specific issues (optional)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'wrongNiche', label: 'Wrong niche/category' },
                { key: 'wrongLocation', label: 'Wrong location' },
                { key: 'tooManyMales', label: 'Too many male influencers' },
                { key: 'tooManyFemales', label: 'Too many female influencers' },
                { key: 'followerCountOff', label: 'Follower count not right' },
                { key: 'notRelevant', label: 'Results not relevant' },
              ].map((issue) => (
                <label key={issue.key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={specificFeedback[issue.key as keyof typeof specificFeedback]}
                    onChange={(e) => setSpecificFeedback(prev => ({
                      ...prev,
                      [issue.key]: e.target.checked
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{issue.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Improved Query */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How would you search instead? (optional)
            </label>
            <textarea
              value={improvedQuery}
              onChange={(e) => setImprovedQuery(e.target.value)}
              placeholder="e.g., 'Find female fitness influencers in Spain with 100k+ followers'"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitFeedback}
              disabled={!rating || !feedback || isSubmitting}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <span>📤</span>
              <span>{isSubmitting ? 'Submitting...' : 'Submit Feedback'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 