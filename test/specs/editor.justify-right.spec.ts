import editor from '../po/editor.po';
import { openNewBlogPostPage, setWideScreen } from './spec-helper';

describe('editor justify right', () => {
    it('should align right the current line when clicking on the justify right button', () => {
        setWideScreen();
        openNewBlogPostPage();
        editor.content.click();
        editor.content.addValue('abc');
        editor.toolbar.justifyRight.click();
        browser.pause(1000);
        expect(editor.content.getHTML(false))
            .toBe('<div style="text-align: right;">abc</div>');
    });
});