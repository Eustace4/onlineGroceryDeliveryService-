<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Business;
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
    ]);

    $business = auth()->user()->businesses()->create([
        'name' => $request->name,
        'email' => $request->email,
        'phone' => $request->phone,
        'address' => $request->address,
        'vendor_id' => auth()->id(),
    ]);

    return response()->json(['message' => 'Business created successfully', 'business' => $business]);
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
    $businesses = Business::all();
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
        'address' => 'nullable|string',
        'phone' => 'nullable|string|max:20',  // Phone allowed to update
    ]);

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


}
