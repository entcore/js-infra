import http from 'axios';
import { Eventer } from 'entcore-toolkit';
import { ImageView } from './ImageView';
import * as imageTools from './image-tools';
import { Tool } from './Tool';
import { Document } from '../workspace';

const eventer = new Eventer();
const editorWidth = 680;
const editorHeight = 400;

export class ImageEditor{
    static loaded: boolean;
    static loading: boolean;
    imageView: ImageView = new ImageView();
    renderer: PIXI.CanvasRenderer | PIXI.WebGLRenderer;
    editingElement: any;
    tool: Tool;
    document: Document;

    constructor(){

    }

    async cancel(keepHistory = false){
        if(typeof this.imageView.appliedIndex === 'number'){
            await this.imageView.loadBlob(this.imageView.history[this.imageView.appliedIndex]);
            this.imageView.history.splice(this.imageView.appliedIndex);
        }
        if(!keepHistory){
            this.imageView.resetHistory();
        }
        
        await this.imageView.backup();

        if(!keepHistory){
            this.imageView.historyIndex = 0;
            this.imageView.appliedIndex = 0;
        }
        else{
            this.imageView.historyIndex = this.imageView.appliedIndex;
        }
    }

    async useTool(name: string, options?){
        this.tool && this.tool.stop();
        const tool = new imageTools[name]();
        
        this.tool = tool;
        await this.cancel();
        tool.start(this.imageView, this.editingElement);
    }

    async applyChanges(options?){
        await this.tool.apply(options);
        this.imageView.appliedIndex = this.imageView.historyIndex;
    }

    async saveChanges(){
        await this.document.update(this.imageView.history[this.imageView.history.length - 1]);
    }

    get hasHistory(){
        return this.imageView.hasHistory;
    }

    get hasFuture(){
        return this.imageView.hasFuture;
    }

    get canApply(){
        return this.imageView.historyIndex > this.imageView.appliedIndex;
    }

    static async init(){
        return new Promise((resolve, reject) => {
            if(ImageEditor.loaded){
                resolve();
                return;
            }
            if(ImageEditor.loading){
                eventer.on('loaded', () => resolve());
                return;
            }
            ImageEditor.loading = true;
            http.get('/infra/public/js/pixi.min.js').then((response) => {
                eval(response.data);
                ImageEditor.loaded = true;
                ImageEditor.loading = false;
                resolve();
                eventer.trigger('loaded');
            });
        })
    }

    async draw(el: any){
        el.find('canvas').remove();
        this.editingElement = el;
        this.renderer = PIXI.autoDetectRenderer(editorWidth, editorHeight, { 
            preserveDrawingBuffer: true,
            transparent: true 
        });
        await ImageEditor.init();
        el.find('.output').append(this.renderer.view);
    }

    async drawDocument(document: Document){
        if(document.hiddenBlob){
            const path = URL.createObjectURL(document.hiddenBlob);
            await this.imageView.load(path, this.renderer, this.editingElement);
        }
        else{
            await this.imageView.load('/workspace/document/' + document._id + '?v=' + parseInt(Math.random() * 100), this.renderer, this.editingElement);
        }
        
        this.document = document;
    }

    async restoreOriginal(){
        await this.imageView.loadBlob(this.imageView.originalImage);
        this.tool.start(this.imageView, this.editingElement);
        this.imageView.resetHistory();
    }

    async undo(){
        await this.imageView.undo();
        if(this.tool.setup){
            this.tool.setup();
        }
    }
}