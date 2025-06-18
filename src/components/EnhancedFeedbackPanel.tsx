'use client';

import { useState } from 'react';

interface EnhancedFeedbackPanelProps {
  searchId: string;
  sessionId: string;
  userId?: string;
  searchQuery: string;
  resultCount: number;
  onFeedbackSubmitted?: (feedback: any) => void;
}

const EnhancedFeedbackPanel: React.FC<EnhancedFeedbackPanelProps> = ({
  searchId,
  sessionId,
  userId,
  searchQuery,
  resultCount,
  onFeedbackSubmitted,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [overallRating, setOverallRating] = useState<number>(0);
  const [searchAccuracy, setSearchAccuracy] = useState<{
    brandMatch: number;
    locationAccuracy: number;
    demographicMatch: number;
    nicheRelevance: number;
    followerRangeAccuracy: number;
  }>({
    brandMatch: 0,
    locationAccuracy: 0,
    demographicMatch: 0,
    nicheRelevance: 0,
    followerRangeAccuracy: 0,
  });
  const [specificIssues, setSpecificIssues] = useState<{
    tooFewResults: boolean;
    wrongGender: boolean;
    wrongLocation: boolean;
    wrongNiche: boolean;
    wrongFollowerCount: boolean;
    notBrandRelevant: boolean;
    duplicateProfiles: boolean;
    lowQualityProfiles: boolean;
  }>({
    tooFewResults: false,
    wrongGender: false,
    wrongLocation: false,
    wrongNiche: false,
    wrongFollowerCount: false,
    notBrandRelevant: false,
    duplicateProfiles: false,
    lowQualityProfiles: false,
  });
  const [improvements, setImprovements] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleQuickFeedback = async (rating: number, feedback: 'excellent' | 'good' | 'poor') => {
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
          resultCount,
          searchQuery,
          quickFeedback: true,
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

  const handleDetailedFeedback = async () => {
    if (!overallRating) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchId,
          sessionId,
          userId,
          overallRating,
          searchAccuracy,
          specificIssues,
          improvements,
          resultCount,
          searchQuery,
          detailedFeedback: true,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setSubmitted(true);
        onFeedbackSubmitted?.(result);
        console.log('📝 Detailed feedback submitted:', result);
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          setIsExpanded(false);
          setSubmitted(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting detailed feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccuracyRating = (category: keyof typeof searchAccuracy, rating: number) => {
    setSearchAccuracy(prev => ({
      ...prev,
      [category]: rating
    }));
  };

  const handleIssueToggle = (issue: keyof typeof specificIssues) => {
    setSpecificIssues(prev => ({
      ...prev,
      [issue]: !prev[issue]
    }));
  };

  if (submitted) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">Thank you for your feedback!</h3>
            <p className="text-green-700 mt-1">
              Your input helps us improve search accuracy and find better influencer matches.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-sm mb-6">
      {!isExpanded ? (
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">How accurate were these search results?</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Found {resultCount} results • Help us improve search quality
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleQuickFeedback(5, 'excellent')}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm"
                disabled={isSubmitting}
              >
                <span>🎯</span>
                <span className="font-medium">Excellent</span>
              </button>
              <button
                onClick={() => handleQuickFeedback(3, 'good')}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors shadow-sm"
                disabled={isSubmitting}
              >
                <span>👍</span>
                <span className="font-medium">Good</span>
              </button>
              <button
                onClick={() => handleQuickFeedback(1, 'poor')}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm"
                disabled={isSubmitting}
              >
                <span>👎</span>
                <span className="font-medium">Poor</span>
              </button>
              <button
                onClick={() => setIsExpanded(true)}
                className="px-4 py-2 text-blue-700 hover:text-blue-800 font-medium border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Detailed Feedback
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-blue-900">Search Accuracy Feedback</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to quick feedback
            </button>
          </div>

          {/* Overall Rating */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-blue-900 mb-3">
              Overall satisfaction with search results
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setOverallRating(star)}
                  className={`p-2 text-3xl transition-all ${
                    overallRating >= star 
                      ? 'text-yellow-400 scale-110' 
                      : 'text-gray-300 hover:text-yellow-300'
                  }`}
                >
                  ⭐
                </button>
              ))}
            </div>
          </div>

          {/* Search Accuracy Questions */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">Search Accuracy Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'brandMatch', label: 'Brand Compatibility', desc: 'How well do results match your brand?' },
                { key: 'locationAccuracy', label: 'Location Targeting', desc: 'Correct geographic targeting?' },
                { key: 'demographicMatch', label: 'Demographics', desc: 'Right age/gender/audience?' },
                { key: 'nicheRelevance', label: 'Niche Relevance', desc: 'Relevant content categories?' },
                { key: 'followerRangeAccuracy', label: 'Follower Range', desc: 'Correct follower counts?' },
              ].map((item) => (
                <div key={item.key} className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="mb-2">
                    <div className="font-medium text-gray-900">{item.label}</div>
                    <div className="text-sm text-gray-600">{item.desc}</div>
                  </div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleAccuracyRating(item.key as keyof typeof searchAccuracy, rating)}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                          searchAccuracy[item.key as keyof typeof searchAccuracy] >= rating
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-600 hover:bg-blue-200'
                        }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Specific Issues */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-blue-900 mb-4">Specific Issues (check all that apply)</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'tooFewResults', label: 'Too few results' },
                { key: 'wrongGender', label: 'Wrong gender' },
                { key: 'wrongLocation', label: 'Wrong location' },
                { key: 'wrongNiche', label: 'Wrong niche' },
                { key: 'wrongFollowerCount', label: 'Wrong follower count' },
                { key: 'notBrandRelevant', label: 'Not brand relevant' },
                { key: 'duplicateProfiles', label: 'Duplicate profiles' },
                { key: 'lowQualityProfiles', label: 'Low quality profiles' },
              ].map((issue) => (
                <label key={issue.key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={specificIssues[issue.key as keyof typeof specificIssues]}
                    onChange={() => handleIssueToggle(issue.key as keyof typeof specificIssues)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{issue.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Improvements */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-blue-900 mb-2">
              How can we improve these search results?
            </label>
            <textarea
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="Suggest specific improvements or describe what you were looking for..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={handleDetailedFeedback}
              disabled={!overallRating || isSubmitting}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                overallRating && !isSubmitting
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Detailed Feedback'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedFeedbackPanel; 