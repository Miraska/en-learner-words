'use client';

import { useState } from 'react';
import { X, Send, AlertTriangle, Bug, Flag, MessageSquare, CheckCircle } from 'lucide-react';
import { reportApi } from '../../lib/report-api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
}

type ReportType = 'bug' | 'dictionary' | 'feature' | 'other';

const reportTypes = [
  { id: 'bug' as ReportType, label: 'Found a Bug', icon: Bug, description: 'Report technical issues' },
  { id: 'dictionary' as ReportType, label: 'Dictionary Issue', icon: Flag, description: 'Report inappropriate content' },
  { id: 'feature' as ReportType, label: 'Feature Request', icon: MessageSquare, description: 'Suggest new features' },
  { id: 'other' as ReportType, label: 'Other', icon: AlertTriangle, description: 'General feedback' },
];

export default function ReportModal({ isOpen, onClose, isLoggedIn }: ReportModalProps) {
  const [reportType, setReportType] = useState<ReportType>('bug');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoggedIn) return;

    setIsSubmitting(true);
    try {
      await reportApi.createReport({
        type: reportType,
        comment: comment.trim(),
      });
      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setComment('');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to submit report:', error);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Project Status & Feedback</h2>
                <p className="text-sm text-gray-600">WordCraft is in early development</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Project Status */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">🚧 Early Development Phase</h3>
            <p className="text-blue-800 text-sm leading-relaxed">
              WordCraft is currently in <strong>Alpha</strong> stage. We're actively developing new features, 
              fixing bugs, and improving the user experience. Your feedback is invaluable to help us 
              create the best language learning platform possible.
            </p>
            <div className="mt-3 text-xs text-blue-700">
              <p>• Features may change or be temporarily unavailable</p>
              <p>• Some bugs and performance issues are expected</p>
              <p>• Your data is safe and will be preserved</p>
            </div>
          </div>

          {!isLoggedIn ? (
            <div className="text-center py-8">
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
                <p className="text-gray-600 mb-4">
                  You need to be logged in to submit reports and feedback.
                </p>
                <div className="flex gap-3 justify-center">
                  <a
                    href="/auth/login"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Sign In
                  </a>
                  <a
                    href="/auth/register"
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Register
                  </a>
                </div>
              </div>
            </div>
          ) : isSubmitted ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Submitted!</h3>
              <p className="text-gray-600">Thank you for your feedback. We'll review it soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Report Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  What would you like to report?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reportTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setReportType(type.id)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          reportType === type.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${
                            reportType === type.id ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div className="text-left">
                            <div className={`font-medium ${
                              reportType === type.id ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                              {type.label}
                            </div>
                            <div className={`text-xs ${
                              reportType === type.id ? 'text-blue-700' : 'text-gray-500'
                            }`}>
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment Field */}
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                  Please describe the issue or suggestion
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Provide as much detail as possible..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={4}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Include steps to reproduce for bugs, or detailed description for feature requests.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!comment.trim() || isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
