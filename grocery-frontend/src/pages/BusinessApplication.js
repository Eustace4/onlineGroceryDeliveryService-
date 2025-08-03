import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Upload,
  Check,
  AlertCircle,
  FileText,
  Camera
} from 'lucide-react';
import styles from './BusinessApplication.module.css';

const BusinessApplication = ({ onBack, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const [formData, setFormData] = useState({
    businessName: '',
    businessEmail: '',
    phoneNumber: '',
    businessAddress: '',
    businessLogo: null,

    businessCategory: '',
    businessDescription: '',
    yearsInBusiness: '',
    numberOfEmployees: '',

    businessLicense: null,
    taxCertificate: null,
    insuranceDocument: null,

    businessHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true }
    },
    deliveryRadius: '5',
    minimumOrder: '25',
    businessPhotos: []
  });

  const fileInputRefs = {
    businessLogo: useRef(null),
    businessLicense: useRef(null),
    taxCertificate: useRef(null),
    insuranceDocument: useRef(null),
    businessPhotos: useRef(null)
  };

  const businessCategories = [
    'Restaurant', 'Grocery Store', 'Pharmacy', 'Electronics', 'Clothing',
    'Home & Garden', 'Beauty & Personal Care', 'Sports & Outdoors',
    'Books & Media', 'Toys & Games', 'Automotive', 'Pet Supplies', 'Other'
  ];

  // --- Validation ---
  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
        if (!formData.businessEmail.trim()) newErrors.businessEmail = 'Business email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.businessEmail)) newErrors.businessEmail = 'Invalid email format';
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
        if (!formData.businessAddress.trim()) newErrors.businessAddress = 'Business address is required';
        break;

      case 2:
        if (!formData.businessCategory) newErrors.businessCategory = 'Business category is required';
        if (!formData.businessDescription.trim()) newErrors.businessDescription = 'Business description is required';
        if (!formData.yearsInBusiness) newErrors.yearsInBusiness = 'Years in business is required';
        if (!formData.numberOfEmployees) newErrors.numberOfEmployees = 'Number of employees is required';
        break;

      case 3:
        if (!formData.businessLicense) newErrors.businessLicense = 'Business license is required';
        if (!formData.taxCertificate) newErrors.taxCertificate = 'Tax certificate is required';
        break;

      case 4:
        if (!formData.deliveryRadius) newErrors.deliveryRadius = 'Delivery radius is required';
        if (!formData.minimumOrder) newErrors.minimumOrder = 'Minimum order amount is required';
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Input Handlers ---
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleFileUpload = (field, file) => {
    if (field === 'businessPhotos') {
      setFormData(prev => ({
        ...prev,
        businessPhotos: [...prev.businessPhotos, ...Array.from(file)]
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // --- Submit ---
  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const formDataToSubmit = new FormData();

      Object.keys(formData).forEach(key => {
        if (key === 'businessHours') {
          formDataToSubmit.append(key, JSON.stringify(formData[key]));
        } else if (key === 'businessPhotos') {
          formData[key].forEach((photo, index) =>
            formDataToSubmit.append(`businessPhotos[${index}]`, photo)
          );
        } else if (formData[key] instanceof File) {
          formDataToSubmit.append(key, formData[key]);
        } else {
          formDataToSubmit.append(key, formData[key]);
        }
      });

      const response = await fetch('/api/business-applications', {
        method: 'POST',
        body: formDataToSubmit,
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });

      if (!response.ok) throw new Error('Failed to submit application');

      const result = await response.json();
      setCurrentStep(5);
      if (onComplete) onComplete(result);

    } catch (error) {
      setSubmitError('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Step Renderers ---
  const renderStepIndicator = () => (
    <div className={styles['step-indicator']}>
      {[1, 2, 3, 4].map((step, index) => (
        <React.Fragment key={step}>
          <div
            className={`${styles['step-circle']} ${
              currentStep >= step ? styles.active : ''
            }`}
          >
            {currentStep > step ? <Check size={16} /> : step}
          </div>
          {index < 3 && (
            <div
              className={`${styles['step-line']} ${
                currentStep > step ? styles.active : ''
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderFileUpload = (field, label, accept = 'image/*', required = false) => (
    <div className={styles['form-group']}>
      <label className={styles.label}>
        {label} {required && <span className={styles.required}>*</span>}
      </label>
      <div
        className={`${styles['file-drop-zone']} ${errors[field] ? styles.error : ''}`}
        onClick={() => fileInputRefs[field]?.current?.click()}
      >
        <input
          ref={fileInputRefs[field]}
          type="file"
          accept={accept}
          onChange={(e) => handleFileUpload(field, e.target.files[0])}
          className={styles.hidden}
        />
        {formData[field] ? (
          <div className={styles['file-uploaded']}>
            <Check size={20} />
            <span>{formData[field].name}</span>
          </div>
        ) : (
          <>
            <Upload size={24} />
            <p>Click to upload {label.toLowerCase()}</p>
            <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              {accept.includes('image') ? 'PNG, JPG up to 5MB' : 'PDF up to 10MB'}
            </p>
          </>
        )}
      </div>
      {errors[field] && <div className={styles['error-message']}>{errors[field]}</div>}
    </div>
  );

  // --- Step 1-5 ---
  const renderStep1 = () => (
    <div className={styles['step-content']}>
      <h2 className={styles['step-title']}>Business Information</h2>
      <p className={styles['step-description']}>Tell us about your business</p>

      {/* Business Name */}
      <div className={styles['form-group']}>
        <label className={styles.label}>
          Business Name <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          className={`${styles.input} ${errors.businessName ? styles.error : ''}`}
          placeholder="Enter your business name"
          value={formData.businessName}
          onChange={(e) => handleInputChange('businessName', e.target.value)}
        />
        {errors.businessName && <div className={styles['error-message']}>{errors.businessName}</div>}
      </div>

      {/* Business Email */}
      <div className={styles['form-group']}>
        <label className={styles.label}>
          Business Email <span className={styles.required}>*</span>
        </label>
        <input
          type="email"
          className={`${styles.input} ${errors.businessEmail ? styles.error : ''}`}
          placeholder="business@example.com"
          value={formData.businessEmail}
          onChange={(e) => handleInputChange('businessEmail', e.target.value)}
        />
        {errors.businessEmail && <div className={styles['error-message']}>{errors.businessEmail}</div>}
      </div>

      {/* Phone Number */}
      <div className={styles['form-group']}>
        <label className={styles.label}>
          Phone Number <span className={styles.required}>*</span>
        </label>
        <input
          type="tel"
          className={`${styles.input} ${errors.phoneNumber ? styles.error : ''}`}
          placeholder="+90 XXX XXX XX XX"
          value={formData.phoneNumber}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
        />
        {errors.phoneNumber && <div className={styles['error-message']}>{errors.phoneNumber}</div>}
      </div>

      {/* Business Address */}
      <div className={styles['form-group']}>
        <label className={styles.label}>
          Business Address <span className={styles.required}>*</span>
        </label>
        <textarea
          className={`${styles.input} ${styles.textarea} ${errors.businessAddress ? styles.error : ''}`}
          placeholder="Enter your complete business address"
          value={formData.businessAddress}
          onChange={(e) => handleInputChange('businessAddress', e.target.value)}
        />
        {errors.businessAddress && <div className={styles['error-message']}>{errors.businessAddress}</div>}
      </div>

      {/* Business Logo */}
      <div className={styles['form-group']}>
        <label className={styles.label}>Business Logo (Optional)</label>
        <div
          className={styles['file-upload']}
          onClick={() => fileInputRefs.businessLogo?.current?.click()}
        >
          <input
            ref={fileInputRefs.businessLogo}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload('businessLogo', e.target.files[0])}
            className={styles.hidden}
          />
          {formData.businessLogo ? (
            <img
              src={URL.createObjectURL(formData.businessLogo)}
              alt="Business Logo"
              className={styles['preview-image']}
            />
          ) : (
            <>
              <Upload size={32} />
              <span className={styles['file-upload-text']}>Upload Logo</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // --- Step 2,3,4,5 are as I provided earlier ---
  const renderStep2 = () => (
    <div className={styles['step-content']}>
        <h2 className={styles['step-title']}>Business Details</h2>
        <p className={styles['step-description']}>Provide more details about your business</p>

        <div className={styles['form-group']}>
        <label className={styles.label}>
            Business Category <span className={styles.required}>*</span>
        </label>
        <select
            className={`${styles.input} ${errors.businessCategory ? styles.error : ''}`}
            value={formData.businessCategory}
            onChange={(e) => handleInputChange('businessCategory', e.target.value)}
        >
            <option value="">Select a category</option>
            {businessCategories.map(category => (
            <option key={category} value={category}>{category}</option>
            ))}
        </select>
        {errors.businessCategory && <div className={styles['error-message']}>{errors.businessCategory}</div>}
        </div>

        <div className={styles['form-group']}>
        <label className={styles.label}>
            Business Description <span className={styles.required}>*</span>
        </label>
        <textarea
            className={`${styles.input} ${styles.textarea} ${errors.businessDescription ? styles.error : ''}`}
            placeholder="Describe your business, products, and services"
            value={formData.businessDescription}
            onChange={(e) => handleInputChange('businessDescription', e.target.value)}
            rows={4}
        />
        {errors.businessDescription && <div className={styles['error-message']}>{errors.businessDescription}</div>}
        </div>

        <div className={styles['form-group']}>
        <label className={styles.label}>
            Years in Business <span className={styles.required}>*</span>
        </label>
        <select
            className={`${styles.input} ${errors.yearsInBusiness ? styles.error : ''}`}
            value={formData.yearsInBusiness}
            onChange={(e) => handleInputChange('yearsInBusiness', e.target.value)}
        >
            <option value="">Select years</option>
            <option value="less-than-1">Less than 1 year</option>
            <option value="1-2">1-2 years</option>
            <option value="3-5">3-5 years</option>
            <option value="5-10">5-10 years</option>
            <option value="more-than-10">More than 10 years</option>
        </select>
        {errors.yearsInBusiness && <div className={styles['error-message']}>{errors.yearsInBusiness}</div>}
        </div>

        <div className={styles['form-group']}>
        <label className={styles.label}>
            Number of Employees <span className={styles.required}>*</span>
        </label>
        <select
            className={`${styles.input} ${errors.numberOfEmployees ? styles.error : ''}`}
            value={formData.numberOfEmployees}
            onChange={(e) => handleInputChange('numberOfEmployees', e.target.value)}
        >
            <option value="">Select range</option>
            <option value="1-5">1-5 employees</option>
            <option value="6-10">6-10 employees</option>
            <option value="11-25">11-25 employees</option>
            <option value="26-50">26-50 employees</option>
            <option value="more-than-50">More than 50 employees</option>
        </select>
        {errors.numberOfEmployees && <div className={styles['error-message']}>{errors.numberOfEmployees}</div>}
        </div>
    </div>
    );

    const renderStep3 = () => (
    <div className={styles['step-content']}>
        <h2 className={styles['step-title']}>Required Documents</h2>
        <p className={styles['step-description']}>Upload the necessary business documents</p>

        <div className={styles['info-box']}>
        <div className={styles['info-title']}>Required Documents</div>
        <ul className={styles['info-list']}>
            <li>Business License or Registration Certificate</li>
            <li>Tax Registration Certificate</li>
            <li>Insurance Document (Optional but recommended)</li>
        </ul>
        </div>

        <div className={styles['documents-grid']}>
        <div className={styles['document-card']}>
            <div className={styles['document-header']}>
            <div className={styles['document-icon']}><FileText /></div>
            <div>
                <div className={styles['document-title']}>Business License</div>
                <div className={styles['document-description']}>Official business registration or license</div>
            </div>
            </div>
            {renderFileUpload('businessLicense', 'Business License', 'application/pdf,image/*', true)}
        </div>

        <div className={styles['document-card']}>
            <div className={styles['document-header']}>
            <div className={styles['document-icon']}><FileText /></div>
            <div>
                <div className={styles['document-title']}>Tax Certificate</div>
                <div className={styles['document-description']}>Tax registration certificate</div>
            </div>
            </div>
            {renderFileUpload('taxCertificate', 'Tax Certificate', 'application/pdf,image/*', true)}
        </div>

        <div className={styles['document-card']}>
            <div className={styles['document-header']}>
            <div className={styles['document-icon']}><FileText /></div>
            <div>
                <div className={styles['document-title']}>Insurance Document</div>
                <div className={styles['document-description']}>Business insurance (Optional)</div>
            </div>
            </div>
            {renderFileUpload('insuranceDocument', 'Insurance Document', 'application/pdf,image/*', false)}
        </div>
        </div>
    </div>
    );

    const renderStep4 = () => (
    <div className={styles['step-content']}>
        <h2 className={styles['step-title']}>Business Settings</h2>
        <p className={styles['step-description']}>Configure your delivery and operational settings</p>

        <div className={styles['form-group']}>
        <label className={styles.label}>
            Delivery Radius (km) <span className={styles.required}>*</span>
        </label>
        <input
            type="number"
            className={`${styles.input} ${errors.deliveryRadius ? styles.error : ''}`}
            placeholder="5"
            value={formData.deliveryRadius}
            onChange={(e) => handleInputChange('deliveryRadius', e.target.value)}
            min="1"
            max="50"
        />
        {errors.deliveryRadius && <div className={styles['error-message']}>{errors.deliveryRadius}</div>}
        </div>

        <div className={styles['form-group']}>
        <label className={styles.label}>
            Minimum Order Amount (₺) <span className={styles.required}>*</span>
        </label>
        <input
            type="number"
            className={`${styles.input} ${errors.minimumOrder ? styles.error : ''}`}
            placeholder="25"
            value={formData.minimumOrder}
            onChange={(e) => handleInputChange('minimumOrder', e.target.value)}
            min="0"
        />
        {errors.minimumOrder && <div className={styles['error-message']}>{errors.minimumOrder}</div>}
        </div>

        <div className={styles['form-group']}>
        <label className={styles.label}>Business Photos (Optional)</label>
        <div className={styles['photos-upload']}>
            <input
            ref={fileInputRefs.businessPhotos}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload('businessPhotos', e.target.files)}
            className={styles.hidden}
            />
            <Camera size={32} />
            <p>Upload photos of your business</p>
            <button
            type="button"
            className={styles['upload-button']}
            onClick={() => fileInputRefs.businessPhotos?.current?.click()}
            >
            Choose Photos
            </button>
        </div>
        {formData.businessPhotos.length > 0 && (
            <div className={styles['photos-preview']}>
            <div className={styles['photos-grid']}>
                {formData.businessPhotos.map((photo, index) => (
                <div key={index} className={styles['photo-item']}>
                    <img
                    src={URL.createObjectURL(photo)}
                    alt={`Business photo ${index + 1}`}
                    className={styles['photo-preview']}
                    />
                    <div className={styles['photo-number']}>{index + 1}</div>
                </div>
                ))}
            </div>
            </div>
        )}
        </div>
    </div>
    );

    const renderStep5 = () => (
    <div className={styles['success-container']}>
        <div className={styles['success-icon']}>
        <Check size={48} />
        </div>
        <h2 className={styles['success-title']}>Application Submitted Successfully!</h2>
        <p className={styles['success-description']}>
        Thank you for submitting your business application. We will review your information and get back to you within 2-3 business days.
        </p>
        <div className={styles['info-box']}>
        <div className={styles['info-title']}>What happens next?</div>
        <ul className={styles['info-list']}>
            <li>Our team will review your application and documents</li>
            <li>We may contact you for additional information if needed</li>
            <li>Once approved, you'll receive access to your vendor dashboard</li>
            <li>You can then start adding products and managing your business</li>
        </ul>
        </div>
        <button
        className={`${styles.btn} ${styles['btn-primary']}`}
        onClick={() => onBack && onBack()}
        >
        Back to Dashboard
        </button>
    </div>
    );


  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles['back-btn']} onClick={onBack}>
          <ArrowLeft />
          Back to Dashboard
        </button>
        <h1 className={styles.title}>Business Application</h1>
        <div></div>
      </div>

      {currentStep <= 4 && renderStepIndicator()}

      <div className={styles['form-container']}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}

        {currentStep <= 4 && (
          <div className={styles.navigation}>
            <button
              className={styles['btn-Secondary']}
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </button>

            {currentStep === 4 ? (
              <button
                className={`${styles['btn-primary']} ${styles['btn-submit']}`}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className={styles['loading-spinner']} />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            ) : (
              <button
                className={styles['myButton']}
                onClick={nextStep}
              >
                Next
              </button>
            )}
          </div>
        )}

        {submitError && (
          <div className={styles['error-alert']}>
            <AlertCircle />
            <span>{submitError}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessApplication;
