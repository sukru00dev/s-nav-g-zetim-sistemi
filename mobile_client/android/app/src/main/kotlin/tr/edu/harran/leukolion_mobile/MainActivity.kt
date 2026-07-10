package tr.edu.harran.leukolion_mobile

import android.os.Bundle
import android.view.WindowManager
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState);
        // Ekran görüntüsü ve ekran kaydı engelleme (Native Android)
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE);
    }
}
