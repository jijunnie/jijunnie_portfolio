import React from 'react';
import { X } from 'lucide-react';
import { getRegionData } from '../../data/visitedRegions';

export default function InfoPanel({ region, marker, onClose }) {
  if (!region && !marker) return null;

  const data = region ? getRegionData(region) : null;
  const displayName = region || marker?.name || 'Unknown';
  const displayType = data?.type || 'location';
  const isVisited = data?.visited || marker?.visited || false;
  const notes = data?.notes || marker?.description || 'No additional information.';

  return (
    <div className="fixed top-24 right-4 md:right-8 w-80 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 z-50 animate-slide-in">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{displayName}</h3>
            <p className="text-sm text-gray-500 capitalize">{displayType}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            aria-label="Close panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Visit Status */}
        <div className="mb-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isVisited ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <span className="text-sm font-medium text-gray-700">
              {isVisited ? 'Visited' : 'Not Visited'}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Notes</h4>
          <p className="text-sm text-gray-600 leading-relaxed">{notes}</p>
        </div>

        {/* Marker coordinates if available */}
        {marker && (
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Coordinates: {marker.lat >= 0 ? marker.lat.toFixed(4) + '°N' : Math.abs(marker.lat).toFixed(4) + '°S'}, {marker.lon >= 0 ? marker.lon.toFixed(4) + '°E' : Math.abs(marker.lon).toFixed(4) + '°W'}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

