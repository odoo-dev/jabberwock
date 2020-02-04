import { JWOwlUIPlugin } from '../../owl-ui/src/JWOwlUIPlugin';
import { OwlUIComponent } from '../../owl-ui/src/OwlUIComponent';
import toolbarTemplates from '../assets/Toolbar.xml';
import { ToolbarComponent } from './components/ToolbarComponent';
import '../assets/Toolbar.css';

export class ToolbarUI extends JWOwlUIPlugin {
    static templates = toolbarTemplates;
    Components = [ToolbarComponent as typeof OwlUIComponent];
}
