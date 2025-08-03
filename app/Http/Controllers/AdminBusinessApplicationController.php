<?php

namespace App\Http\Controllers;

use App\Models\BusinessApplication;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class AdminBusinessApplicationController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (auth()->user()->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            return $next($request);
        });
    }

    /**
     * Get all pending applications
     */
    public function pendingApplications()
    {
        $applications = BusinessApplication::pending()
            ->with(['user:id,name,email'])
            ->orderBy('submitted_at', 'desc')
            ->get();
            
        return response()->json($applications);
    }

    /**
     * Get all applications with optional status filter
     */
    public function allApplications(Request $request)
    {
        $query = BusinessApplication::with(['user:id,name,email', 'reviewer:id,name']);
        
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }
        
        $applications = $query->orderBy('submitted_at', 'desc')->get();
        
        return response()->json($applications);
    }

    /**
     * Get specific application details
     */
    public function showApplication($id)
    {
        $application = BusinessApplication::with(['user:id,name,email,phone', 'reviewer:id,name'])
            ->findOrFail($id);
            
        return response()->json($application);
    }

    /**
     * Approve application and create business
     */
    public function approveApplication(Request $request, $id)
    {
        $application = BusinessApplication::findOrFail($id);
        
        if (!$application->isPending()) {
            return response()->json([
                'message' => 'Application is not in pending status'
            ], 400);
        }

        // Create the business from the application
        $business = new Business();
        $business->vendor_id = $application->user_id; // Using your existing vendor_id field
        $business->name = $application->name;
        $business->email = $application->email;
        $business->phone = $application->phone;
        $business->address = $application->address;
        $business->logo = $application->logo;
        $business->status = 'active'; // If you add status to Business model
        $business->save();

        // Update application status
        $application->status = 'approved';
        $application->reviewed_at = now();
        $application->reviewed_by = auth()->id();
        $application->business_id = $business->id;
        $application->admin_notes = $request->admin_notes;
        $application->save();
        
        // TODO: Send notification to vendor about approval
        
        return response()->json([
            'message' => 'Application approved and business created successfully',
            'application' => $application->load('user:id,name,email', 'reviewer:id,name', 'business'),
            'business' => $business
        ]);
    }

    /**
     * Reject application
     */
    public function rejectApplication(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:1000',
            'admin_notes' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $application = BusinessApplication::findOrFail($id);
        
        if (!$application->isPending()) {
            return response()->json([
                'message' => 'Application is not in pending status'
            ], 400);
        }
        
        $application->status = 'rejected';
        $application->rejection_reason = $request->reason;
        $application->admin_notes = $request->admin_notes;
        $application->reviewed_at = now();
        $application->reviewed_by = auth()->id();
        $application->save();
        
        // TODO: Send notification to vendor about rejection
        
        return response()->json([
            'message' => 'Application rejected successfully',
            'application' => $application->load('user:id,name,email', 'reviewer:id,name')
        ]);
    }

    /**
     * Get application statistics
     */
    public function getApplicationStats()
    {
        $stats = [
            'total' => BusinessApplication::count(),
            'pending' => BusinessApplication::pending()->count(),
            'approved' => BusinessApplication::approved()->count(),
            'rejected' => BusinessApplication::rejected()->count(),
        ];
        
        return response()->json($stats);
    }

    /**
     * Download application document
     */
    public function downloadDocument($applicationId, $documentType)
    {
        $application = BusinessApplication::findOrFail($applicationId);
        
        $validDocuments = [
            'business_license',
            'tax_certificate', 
            'owner_id_document',
            'health_safety_cert',
            'address_proof'
        ];
        
        if (!in_array($documentType, $validDocuments)) {
            return response()->json(['message' => 'Invalid document type'], 400);
        }
        
        $filePath = $application->$documentType;
        
        if (!$filePath || !Storage::disk('public')->exists($filePath)) {
            return response()->json(['message' => 'Document not found'], 404);
        }
        
        return Storage::disk('public')->download($filePath);
    }

    /**
     * View storefront photos
     */
    public function viewStorefrontPhotos($applicationId)
    {
        $application = BusinessApplication::findOrFail($applicationId);
        
        if (!$application->storefront_photos) {
            return response()->json(['message' => 'No storefront photos found'], 404);
        }
        
        $photoUrls = array_map(function($photo) {
            return asset('storage/' . $photo);
        }, $application->storefront_photos);
        
        return response()->json([
            'application_id' => $applicationId,
            'business_name' => $application->name,
            'photos' => $photoUrls
        ]);
    }

    /**
     * Add admin notes to application
     */
    public function addNotes(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'notes' => 'required|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $application = BusinessApplication::findOrFail($id);
        $application->admin_notes = $request->notes;
        $application->save();

        return response()->json([
            'message' => 'Notes added successfully',
            'application' => $application
        ]);
    }
}