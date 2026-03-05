'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/axios';
import MarketingCanvas from '@/components/marketing/MarketingCanvas';
import { AlertCircle, Home, ChevronLeft } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Property {
  id: string | number;
  title: string;
  owner: string | number;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  price?: number;
  location?: string;
  city?: string;
  description?: string;
  images?: string[];
  property_type?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  contact_number?: string;
}

interface User {
  id: string | number;
  email: string;
  name?: string;
  phone?: string;
  phone_number?: string;
  is_staff?: boolean;
}
// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================

const LoadingState: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="spinner" />
        <h2 className="loading-title">Loading Marketing Kit</h2>
        <p className="loading-subtitle">
          Verifying access and preparing templates...
        </p>
      </div>

      <style jsx>{`
        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: #f9fafb;
          padding: 20px;
        }

        .loading-content {
          text-align: center;
          max-width: 400px;
        }

        .spinner {
          width: 64px;
          height: 64px;
          border: 4px solid #e5e7eb;
          border-top-color: #2d5f3f;
          border-radius: 50%;
          margin: 0 auto 20px;
          animation: spin 1s linear infinite;
        }

        .loading-title {
          font-size: 18px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 8px;
        }

        .loading-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 640px) {
          .loading-title {
            font-size: 16px;
          }
          .loading-subtitle {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// ERROR STATE COMPONENT
// ============================================================================

interface ErrorStateProps {
  error?: string | null;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error }) => {
  const router = useRouter();

  return (
    <div className="error-container">
      <div className="error-card">
        <div className="error-icon-wrapper">
          <AlertCircle size={32} className="error-icon" />
        </div>
        <h2 className="error-title">{error || 'Access Denied'}</h2>
        <p className="error-message">
          {error
            ? 'There was an issue loading this property. You will be redirected shortly.'
            : 'You do not have permission to access this marketing kit.'}
        </p>
        <button
          onClick={() => router.push('/dashboard/my-listings')}
          className="error-button"
          aria-label="Return to my listings"
        >
          <Home size={20} />
          <span>Go to My Listings</span>
        </button>
      </div>

      <style jsx>{`
        .error-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background-color: #f9fafb;
          padding: 20px;
        }

        .error-card {
          background-color: #ffffff;
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          width: 100%;
          text-align: center;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid #fee2e2;
        }

        .error-icon-wrapper {
          width: 64px;
          height: 64px;
          background-color: #fee2e2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
        }

        .error-icon {
          color: #dc2626;
        }

        .error-title {
          font-size: 24px;
          font-weight: bold;
          color: #111827;
          margin: 0 0 12px 0;
        }

        .error-message {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 24px 0;
          line-height: 1.5;
        }

        .error-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          background-color: #2d5f3f;
          color: #ffffff;
          border-radius: 12px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
        }

        .error-button:hover {
          background-color: #234a31;
          transform: scale(1.05);
        }

        .error-button:active {
          transform: scale(0.98);
        }

        .error-button:focus {
          outline: 2px solid #2d5f3f;
          outline-offset: 2px;
        }

        @media (max-width: 640px) {
          .error-card {
            padding: 24px;
          }

          .error-title {
            font-size: 20px;
          }

          .error-message {
            font-size: 14px;
          }

          .error-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// MARKETING HEADER COMPONENT
// ============================================================================

interface MarketingHeaderProps {
  property: Property;
  isMobile: boolean;
  onBack: () => void;
}

const MarketingHeader: React.FC<MarketingHeaderProps> = ({
  property,
  isMobile,
  onBack,
}) => {
  return (
    <>
      <header className="header">
        <button
          onClick={onBack}
          className="back-button"
          aria-label="Go back to previous page"
        >
          <ChevronLeft size={isMobile ? 20 : 24} />
        </button>

        <div className="title-section">
          <h1 className="title">🎨 Marketing Kit</h1>
          {!isMobile && (
            <p className="subtitle">{property.title || 'Property Marketing Templates'}</p>
          )}
        </div>

        {!isMobile && (
          <div className="badge">
            {property.bedrooms ? `${property.bedrooms} BHK` : 'Property'}
          </div>
        )}
      </header>

      {/* Mobile Info Banner */}
      {isMobile && (
        <div className="mobile-banner">
          <span className="banner-icon">📍</span>
          <span className="banner-text">{property.title}</span>
        </div>
      )}

      <style jsx>{`
        .header {
          display: flex;
          align-items: center;
          padding: ${isMobile ? '12px 16px' : '16px 24px'};
          background-color: #ffffff;
          border-bottom: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          z-index: 20;
          flex-shrink: 0;
          gap: ${isMobile ? '12px' : '16px'};
        }

        .back-button {
          padding: ${isMobile ? '8px' : '10px'};
          background-color: #f3f4f6;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
          color: #374151;
          min-width: ${isMobile ? '40px' : '44px'};
          min-height: ${isMobile ? '40px' : '44px'};
        }

        .back-button:hover {
          background-color: #e5e7eb;
          transform: scale(1.05);
        }

        .back-button:active {
          transform: scale(0.95);
        }

        .back-button:focus {
          outline: 2px solid #2d5f3f;
          outline-offset: 2px;
        }

        .title-section {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .title {
          font-size: ${isMobile ? '16px' : '20px'};
          font-weight: bold;
          color: #111827;
          margin: 0;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap; 
        }

        .subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 4px 0 0 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .badge {
          padding: 6px 16px;
          background-color: #ecfdf5;
          color: #065f46;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          border: 1px solid #a7f3d0;
          flex-shrink: 0;
        }

        .mobile-banner {
          padding: 10px 16px;
          background-color: #fffbeb;
          border-bottom: 1px solid #fde68a;
          font-size: 13px;
          color: #92400e;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .banner-icon {
          font-weight: 600;
          flex-shrink: 0;
        }

        .banner-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        @media (max-width: 640px) {
          .header {
            position: sticky;
            top: 0;
            z-index: 30;
            -webkit-user-select: none;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
             padding: 10px 12px; /* Slightly tighter padding on very small screens */
          }
           
           .title {
              font-size: 15px; /* Slightly smaller for better fit */
           }
        }
      `}</style>
    </>
  );
};

// ============================================================================
// CUSTOM HOOKS
// ============================================================================

// Hook for mobile detection
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Hook for property access verification
const usePropertyAccess = (id: string | undefined) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redirectPath, setRedirectPath] = useState('/dashboard/my-listings');
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      if (!id) {
        setError('Property ID not found');
        setLoading(false);
        return;
      }

      try {
        // Fetch property and user data in parallel for better performance
        const [propResponse, userResponse] = await Promise.all([
          api.get<Property>(`/api/properties/${id}/`),
          api.get<User>('/api/user/me/'),
        ]);

        const propertyData = propResponse.data as any; // Cast to any to access nested fields safely if interface is incomplete
        const userData = userResponse.data;

        // Set up the proper return path depending on role
        const returnPath = userData.is_staff ? '/admin/properties' : '/dashboard/my-listings';
        setRedirectPath(returnPath);

        // Verify ownership or staff privileges
        if (String(propertyData.owner) !== String(userData.id) && !userData.is_staff) {
          console.error('Unauthorized: User does not own this property and is not staff');
          setError('You are not authorized to access this property');
          setTimeout(() => router.push(returnPath), 2000);
          return;
        }

        // Inject user's phone number into property data
        // Priority: User's Profile Phone > Property Owner Phone > Property WhatsApp > Empty
        const propertyWithContact = {
          ...propertyData,
          contact_number: userData.phone_number || userData.phone || propertyData.owner_details?.phone_number || propertyData.whatsapp_number || ''
        };

        setProperty(propertyWithContact);
        setAuthorized(true);
      } catch (err: any) {
        console.error('Failed to fetch property or verify access', err);
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.detail ||
          'Failed to load property';
        setError(errorMessage);
        setTimeout(() => router.push('/dashboard/my-listings'), 3000);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [id, router]);

  return { property, loading, authorized, error, redirectPath };
};

// ============================================================================
// MAIN MARKETING PAGE COMPONENT
// ============================================================================

export default function MarketingPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const isMobile = useIsMobile();
  const { property, loading, authorized, error, redirectPath } = usePropertyAccess(id);

  const handleGoBack = useCallback(() => {
    if (window.history.length > 2) {
      router.back();
    } else {
      router.push(redirectPath);
    }
  }, [router, redirectPath]);

  // Loading State
  if (loading) {
    return <LoadingState />;
  }

  // Error State
  if (error || !authorized || !property) {
    return <ErrorState error={error} />;
  }

  // Main Content
  return (
    <div className="marketing-page">
      <MarketingHeader
        property={property}
        isMobile={isMobile}
        onBack={handleGoBack}
      />

      <main className="main-content">
        <MarketingCanvas property={property} />
      </main>

      {/* Help Text - Mobile Bottom */}
      {isMobile && (
        <div className="mobile-tip">
          💡 Tip: Use landscape mode for better preview
        </div>
      )}

      <style jsx>{`
        .marketing-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: #f9fafb;
          overflow: hidden;
        }

        .main-content {
          flex: 1;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
        }

        .mobile-tip {
          padding: 8px 16px;
          background-color: #f3f4f6;
          font-size: 11px;
          color: #6b7280;
          text-align: center;
          border-top: 1px solid #e5e7eb;
          position: sticky;
          bottom: 0;
          z-index: 10;
        }

        @media (min-width: 768px) {
          .mobile-tip {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .marketing-page {
            height: 100dvh; /* Use dynamic viewport height on mobile */
          }
        }

        /* Tablet optimization */
        @media (min-width: 768px) and (max-width: 1024px) {
          .marketing-page {
            height: 100vh;
          }
        }

        /* Landscape phone */
        @media (max-width: 768px) and (orientation: landscape) {
          .mobile-tip {
            display: none;
          }

          .marketing-page {
            height: 100vh;
          }
        }

        /* Support for iOS safe areas */
        @supports (padding: env(safe-area-inset-bottom)) {
          .mobile-tip {
            padding-bottom: calc(8px + env(safe-area-inset-bottom));
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .marketing-page {
            background-color: #111827;
          }
        }

        /* Reduced motion accessibility */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .marketing-page {
            border: 2px solid currentColor;
          }
        }

        /* Touch-friendly interactions */
        @media (pointer: coarse) {
          button {
            min-height: 44px;
            min-width: 44px;
          }
        }
      `}</style>
    </div>
  );
}
