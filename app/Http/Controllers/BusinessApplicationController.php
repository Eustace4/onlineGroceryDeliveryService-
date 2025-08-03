<?php

namespace App\Http\Controllers;

use App\Models\BusinessApplication;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class BusinessApplicationController extends Controller
{
    /**
     * Submit a new business application
     */
    public function store(Request $request)
    {
        if (auth()->user()->role !== 'vendor') {
            return response()->json(['message' => 'Only vendors can submit business applications.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:business_applications,email',
            'phone' => 'required|string',
            'address' => 'required|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            
            // Required documents
            'business_license' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'tax_certificate' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'owner_id_document' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'health_safety_cert' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'address_proof' => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'storefront_photos' => 'required|array|min:2|max:5',
            'storefront_photos.*' => 'image|mimes:jpeg,png,jpg|max:3072'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $application = new BusinessApplication();
        $application->user_id = auth()->id();
        $application->name = $request->name;
        $application->email = $request->email;
        $application->phone = $request->phone;
        $application->address = $request->address;
        $application->status = 'pending';
        $application->submitted_at = now();

        // Handle logo upload
        if ($request->hasFile('logo')) {
            $application->logo = $request->file('logo')->store('business_logos', 'public');
        }

        // Handle document uploads
        $application->business_license = $request->file('business_license')->store('business_documents', 'public');
        $application->tax_certificate = $request->file('tax_certificate')->store('business_documents', 'public');
        $application->owner_id_document = $request->file('owner_id_document')->store('business_documents', 'public');
        $application->address_proof = $request->file('address_proof')->store('business_documents', 'public');

        if ($request->hasFile('health_safety_cert')) {
            $application->health_safety_cert = $request->file('health_safety_cert')->store('business_documents', 'public');
        }

        // Handle multiple storefront photos
        $photos = [];
        foreach ($request->file('storefront_photos') as $photo) {
            $photos[] = $photo->store('storefront_photos', 'public');
        }
        $application->storefront_photos = $photos;

        $application->save();

        return response()->json([
            'message' => 'Business application submitted successfully. It will be reviewed by an administrator.',
            'application' => $application
        ], 201);
    }

    /**
     * Get user's business applications
     */
    public function index(Request $request)
    {
        $applications = BusinessApplication::where('user_id', auth()->id())
            ->with('reviewer:id,name')
            ->orderBy('submitted_at', 'desc')
            ->get();

        return response()->json($applications);
    }

    /**
     * Get specific application details
     */
    public function show($id)
    {
        $application = BusinessApplication::where('user_id', auth()->id())
            ->with(['reviewer:id,name', 'business:id,name'])
            ->findOrFail($id);

        return response()->json($application);
    }

    /**
     * Update pending application
     */
    public function update(Request $request, $id)
    {
        $application = BusinessApplication::where('user_id', auth()->id())->findOrFail($id);

        if (!$application->isPending()) {
            return response()->json([
                'message' => 'Cannot update application that has already been reviewed'
            ], 400);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:business_applications,email,' . $id,
            'phone' => 'sometimes|string',
            'address' => 'sometimes|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            
            'business_license' => 'sometimes|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'tax_certificate' => 'sometimes|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'owner_id_document' => 'sometimes|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'health_safety_cert' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'address_proof' => 'sometimes|file|mimes:pdf,jpg,jpeg,png|max:5120',
            'storefront_photos' => 'sometimes|array|min:2|max:5',
            'storefront_photos.*' => 'image|mimes:jpeg,png,jpg|max:3072'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update basic fields
        $application->fill($request->only(['name', 'email', 'phone', 'address']));

        // Handle file uploads
        if ($request->hasFile('logo')) {
            if ($application->logo) {
                Storage::disk('public')->delete($application->logo);
            }
            $application->logo = $request->file('logo')->store('business_logos', 'public');
        }

        // Update documents
        $documentFields = ['business_license', 'tax_certificate', 'owner_id_document', 'health_safety_cert', 'address_proof'];
        
        foreach ($documentFields as $field) {
            if ($request->hasFile($field)) {
                if ($application->$field) {
                    Storage::disk('public')->delete($application->$field);
                }
                $application->$field = $request->file($field)->store('business_documents', 'public');
            }
        }

        // Handle storefront photos
        if ($request->hasFile('storefront_photos')) {
            if ($application->storefront_photos) {
                foreach ($application->storefront_photos as $photo) {
                    Storage::disk('public')->delete($photo);
                }
            }
            
            $photos = [];
            foreach ($request->file('storefront_photos') as $photo) {
                $photos[] = $photo->store('storefront_photos', 'public');
            }
            $application->storefront_photos = $photos;
        }

        $application->save();

        return response()->json([
            'message' => 'Application updated successfully',
            'application' => $application
        ]);
    }

    /**
     * Delete pending application
     */
    public function destroy($id)
    {
        $application = BusinessApplication::where('user_id', auth()->id())->findOrFail($id);

        if (!$application->isPending()) {
            return response()->json([
                'message' => 'Cannot delete application that has already been reviewed'
            ], 400);
        }

        // Delete associated files
        $this->deleteApplicationFiles($application);
        
        $application->delete();

        return response()->json(['message' => 'Application deleted successfully']);
    }

    /**
     * Helper method to delete application files
     */
    private function deleteApplicationFiles(BusinessApplication $application)
    {
        $filesToDelete = [
            $application->logo,
            $application->business_license,
            $application->tax_certificate,
            $application->owner_id_document,
            $application->health_safety_cert,
            $application->address_proof
        ];

        foreach ($filesToDelete as $file) {
            if ($file && Storage::disk('public')->exists($file)) {
                Storage::disk('public')->delete($file);
            }
        }

        if ($application->storefront_photos) {
            foreach ($application->storefront_photos as $photo) {
                if (Storage::disk('public')->exists($photo)) {
                    Storage::disk('public')->delete($photo);
                }
            }
        }
    }
}