namespace App\Http\Controllers;

use App\Models\Wishlist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class WishlistController extends Controller
{
    public function index()
    {
        $wishlist = Wishlist::with('product')->where('user_id', Auth::id())->get();
        return response()->json($wishlist);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $wishlist = Wishlist::firstOrCreate([
            'user_id' => Auth::id(),
            'product_id' => $request->product_id,
        ]);

        return response()->json($wishlist, 201);
    }

    public function destroy($product_id)
    {
        Wishlist::where('user_id', Auth::id())
                ->where('product_id', $product_id)
                ->delete();

        return response()->json(['message' => 'Removed from wishlist']);
    }
}
