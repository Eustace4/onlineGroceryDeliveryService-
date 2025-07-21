<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Business;
use Illuminate\Support\Facades\Auth;  
use Illuminate\Support\Facades\Log;

class BusinessController extends Controller
{
    public function store(Request $request)
{
    if (auth()->user()->role !== 'vendor') {
        return response()->json(['message' => 'Only vendors can create businesses.'], 403);
    }

    $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email',
        'phone' => 'required|string|max:20',
        'address' => 'required|string|max:255',
        'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
    ]);

    $business = auth()->user()->businesses()->create([
        'name' => $request->name,
        'email' => $request->email,
        'phone' => $request->phone,
        'address' => $request->address,
        'vendor_id' => auth()->id(),
    ]);

    // ✅ Handle logo upload
    if ($request->hasFile('logo')) {
        $logoPath = $request->file('logo')->store('business_logos', 'public');
        $business->logo = $logoPath;
        $business->save();
    }

    return response()->json([
        'message' => 'Business created successfully',
        'business' => $business
    ]);
}


public function show($id)
{
    $business = Business::find($id);

    if (!$business) {
        return response()->json(['message' => 'Business not found'], 404);
    }

    return response()->json($business);
}

public function index()
{
    $user = Auth::user();

    if ($user->role === 'vendor') {
        $businesses = $user->businesses()->withCount('products')->get();
    } elseif ($user->role === 'admin') {
        $businesses = Business::withCount('products')->get(); // Admin sees all
    } else {
        return response()->json(['message' => 'Unauthorized'], 403);
    }
    //$businesses = Business::withCount('products')->get();
    return response()->json($businesses);
}

public function indexForCustomer()
{
    $businesses = Business::withCount('products')->get();
    return response()->json($businesses);
}

public function update(Request $request, $id)
{
    $user = auth()->user();

    if (!in_array($user->role, ['vendor', 'admin'])) {
        return response()->json(['message' => 'Unauthorized. Only vendors or admins can update businesses.'], 403);
    }

    $business = Business::find($id);
    if (!$business) {
        return response()->json(['message' => 'Business not found.'], 404);
    }

    if ($user->role === 'vendor' && $business->vendor_id !== $user->id) {
        return response()->json(['message' => 'You can only update your own business.'], 403);
    }

    $validated = $request->validate([
        'name' => 'string|max:255',
        'email' => 'email|nullable',
        'phone' => 'nullable|string|max:20',
        'address' => 'nullable|string',
        'logo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048'
    ]);

    // Save logo file if present
    if ($request->hasFile('logo')) {
        $path = $request->file('logo')->store('logos', 'public');
        $validated['logo'] = $path;
    }

    $business->update($validated);

    return response()->json(['message' => 'Business updated successfully.', 'business' => $business]);
}

public function destroy($id)
{
    $user = auth()->user();

    $business = Business::find($id);
    if (!$business) {
        return response()->json(['message' => 'Business not found.'], 404);
    }

    // ✅ Vendors can only delete their own businesses
    if ($user->role === 'vendor' && $business->vendor_id !== $user->id) {
        return response()->json(['message' => 'You can only delete your own business.'], 403);
    }

    // ✅ Admin can delete any business
    if (!in_array($user->role, ['vendor', 'admin'])) {
        return response()->json(['message' => 'Unauthorized.'], 403);
    }

    $business->delete();

    return response()->json(['message' => 'Business deleted successfully.']);
}
// In BusinessController
public function myBusinesses()
{
    $user = Auth::user();

    if ($user->role !== 'vendor') {
        return response()->json(['message' => 'Unauthorized'], 403);
    }
    
    $businesses = $user->businesses()->select('id', 'name', 'email', 'phone', 'address')->get();

    return response()->json($businesses);
}


}
