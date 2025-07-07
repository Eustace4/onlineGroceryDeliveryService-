<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AddressController extends Controller
{
    // ✅ Update address
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $address = Address::findOrFail($id);

        if (!in_array($user->role, ['admin', 'customer'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role === 'customer' && $address->user_id !== $user->id) {
            return response()->json(['message' => 'You do not own this address'], 403);
        }

        $request->validate([
            'street' => 'sometimes|string',
            'city' => 'sometimes|string',
            'state' => 'sometimes|string',
            'postal_code' => 'sometimes|string',
            'country' => 'sometimes|string',
        ]);

        $address->update($request->all());

        return response()->json(['message' => 'Address updated', 'address' => $address]);
    }

    // ✅ Delete address
    public function destroy($id)
    {
        $user = Auth::user();
        $address = Address::findOrFail($id);

        if (!in_array($user->role, ['admin', 'customer'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role === 'customer' && $address->user_id !== $user->id) {
            return response()->json(['message' => 'You do not own this address'], 403);
        }

        $address->delete();

        return response()->json(['message' => 'Address deleted']);
    }
    // ✅ Customer views their own addresses
    public function index()
    {
        $user = Auth::user();

        if (!in_array($user->role, ['admin', 'customer'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $addresses = $user->addresses;

        return response()->json($addresses);
    }

    // ✅ Admin views addresses for any user
    public function userAddresses($userId)
    {
        $user = Auth::user();

        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $addresses = \App\Models\Address::where('user_id', $userId)->get();

        return response()->json($addresses);
    }

}
