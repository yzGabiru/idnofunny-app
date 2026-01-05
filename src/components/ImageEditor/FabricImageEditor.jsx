import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { 
  IonButton, IonIcon, IonRange, IonChip
} from '@ionic/react';
import { 
  textOutline, brushOutline, cropOutline, 
  arrowUndoOutline, arrowRedoOutline, checkmarkOutline, closeOutline,
  trashOutline, cutOutline, shapesOutline, squareOutline, ellipseOutline
} from 'ionicons/icons';

const FONTS = ['Impact', 'Arial', 'Comic Sans MS', 'Courier New', 'Times New Roman'];

const FabricImageEditor = ({ imageUrl, onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [fabricCanvas, setFabricCanvas] = useState(null);
  const canvasInstance = useRef(null); // Ref to track the instance synchronously
  const [activeTool, setActiveTool] = useState(null); 
  
  // Settings
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [brushSize, setBrushSize] = useState(5);
  const [selectedFont, setSelectedFont] = useState('Impact');

  // History
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isHistoryProcessing, setIsHistoryProcessing] = useState(false);

  // Cropping
  const [isCropping, setIsCropping] = useState(false);
  const [cropRect, setCropRect] = useState(null);

  // --- INITIALIZATION ---
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    // Safety check: Dispose if reference exists but cleanup missed it
    if (canvasInstance.current) {
      canvasInstance.current.dispose();
    }

    const canvas = new fabric.Canvas(canvasRef.current, {
      selection: true,
      backgroundColor: '#000',
      preserveObjectStacking: true,
    });
    
    canvasInstance.current = canvas;
    setFabricCanvas(canvas);

    const updateDimensions = () => {
      if(containerRef.current && canvasInstance.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        
        canvasInstance.current.setWidth(width);
        canvasInstance.current.setHeight(height);
        canvasInstance.current.renderAll();
        canvasInstance.current.calcOffset();
      }
    };
    
    // Initial resize
    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
       updateDimensions();
    });
    resizeObserver.observe(containerRef.current);
    
    // Initial Load
    loadImageToCanvas(canvas, imageUrl);

    return () => {
      resizeObserver.disconnect();
      if (canvasInstance.current) {
        canvasInstance.current.dispose();
        canvasInstance.current = null;
        setFabricCanvas(null);
      }
    };
  }, []); // Only run once on mount

  const loadImageToCanvas = (canvas, url) => {
    if (!canvas) return;

    fabric.Image.fromURL(url, (img) => {
      if(!img || !canvas.getContext()) return; // Check context to avoid clearRect error

      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      
      const scaleX = canvasWidth / img.width;
      const scaleY = canvasHeight / img.height;
      const scale = Math.min(scaleX, scaleY); 

      const finalScale = Math.min(scale, 1) > 0.1 ? Math.min(scale, 1) : scale;

      img.set({
        scaleX: finalScale,
        scaleY: finalScale,
        originX: 'center',
        originY: 'center',
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        selectable: false,
        evented: false,
        id: 'bg_image' 
      });

      // Safe clear
      canvas.clear();
      canvas.setBackgroundColor('#000', () => canvas.renderAll());
      canvas.add(img);
      canvas.renderAll();
      
      const json = JSON.stringify(canvas.toJSON());
      setHistory([json]);
      setHistoryIndex(0);
    }, { crossOrigin: 'anonymous' });
  };

  // --- HISTORY LOGIC ---
  const saveHistory = () => {
    if (!fabricCanvas || isHistoryProcessing) return;

    const json = JSON.stringify(fabricCanvas.toJSON());
    if (history.length > 0 && history[historyIndex] === json) return;

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(json);
    
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const loadHistory = (index) => {
    if (!fabricCanvas || index < 0 || index >= history.length) return;
    
    setIsHistoryProcessing(true);
    
    fabricCanvas.loadFromJSON(history[index], () => {
      fabricCanvas.renderAll();
      setHistoryIndex(index);
      setIsHistoryProcessing(false);
      
      if (activeTool === 'draw') {
        enableDrawing(fabricCanvas);
      }
    });
  };

  // Capture canvas changes
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleModification = () => {
      if (!isCropping) saveHistory();
    };

    fabricCanvas.on('object:modified', handleModification);
    fabricCanvas.on('object:added', handleModification);
    fabricCanvas.on('object:removed', handleModification);
    fabricCanvas.on('path:created', handleModification);

    return () => {
      fabricCanvas.off('object:modified', handleModification);
      fabricCanvas.off('object:added', handleModification);
      fabricCanvas.off('object:removed', handleModification);
      fabricCanvas.off('path:created', handleModification);
    };
  }, [fabricCanvas, isHistoryProcessing, historyIndex, history, isCropping]);


  // --- TOOLS IMPLEMENTATION ---

  const enableDrawing = (canvas) => {
    canvas.isDrawingMode = true;
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
    canvas.freeDrawingBrush.color = brushColor;
    canvas.freeDrawingBrush.width = brushSize;
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  };

  const toggleDrawing = () => {
    if (!fabricCanvas) return;
    if (activeTool === 'draw') {
      fabricCanvas.isDrawingMode = false;
      setActiveTool(null);
    } else {
      setActiveTool('draw');
      enableDrawing(fabricCanvas);
    }
  };

  const toggleShapes = () => {
    if (!fabricCanvas) return;
    fabricCanvas.isDrawingMode = false;
    setActiveTool(activeTool === 'shapes' ? null : 'shapes');
  };

  const addShape = (type) => {
    if (!fabricCanvas) return;
    
    const commonProps = {
      left: fabricCanvas.getWidth() / 2,
      top: fabricCanvas.getHeight() / 2,
      originX: 'center',
      originY: 'center',
      fill: brushColor,
      stroke: 'transparent',
      strokeWidth: 0,
      borderColor: '#2196f3',
      cornerColor: '#2196f3',
      cornerSize: 10,
      transparentCorners: false
    };

    let shape;
    if (type === 'rect') {
      shape = new fabric.Rect({
        ...commonProps,
        width: 100,
        height: 100,
      });
    } else if (type === 'circle') {
      shape = new fabric.Circle({
        ...commonProps,
        radius: 60,
      });
    }

    fabricCanvas.add(shape);
    fabricCanvas.setActiveObject(shape);
    fabricCanvas.requestRenderAll();
    saveHistory();
  };

  const addText = () => {
    if (!fabricCanvas) return;
    fabricCanvas.isDrawingMode = false;
    setActiveTool('text');

    const text = new fabric.IText('Edite-me', {
      left: fabricCanvas.getWidth() / 2,
      top: fabricCanvas.getHeight() / 2,
      fontFamily: selectedFont,
      fill: brushColor,
      fontSize: 40,
      originX: 'center',
      originY: 'center',
      borderColor: '#2196f3',
      cornerColor: '#2196f3',
      cornerSize: 10,
      transparentCorners: false
    });

    fabricCanvas.add(text);
    fabricCanvas.setActiveObject(text);
    fabricCanvas.requestRenderAll();
    saveHistory();
  };

  const changeFont = (font) => {
    setSelectedFont(font);
    if (!fabricCanvas) return;
    const activeObj = fabricCanvas.getActiveObject();
    if (activeObj && (activeObj.type === 'i-text' || activeObj.type === 'text')) {
      activeObj.set('fontFamily', font);
      fabricCanvas.requestRenderAll();
      saveHistory();
    }
  };

  const deleteSelected = () => {
    if (!fabricCanvas) return;
    const activeObj = fabricCanvas.getActiveObject();
    if (activeObj) {
      fabricCanvas.remove(activeObj);
      fabricCanvas.discardActiveObject();
      fabricCanvas.requestRenderAll();
      saveHistory();
    }
  };

  // --- CROP IMPLEMENTATION ---

  const startCrop = () => {
    if (!fabricCanvas) return;
    fabricCanvas.isDrawingMode = false;
    setActiveTool('crop');
    setIsCropping(true);

    const width = fabricCanvas.getWidth() * 0.8;
    const height = fabricCanvas.getHeight() * 0.8;
    
    const rect = new fabric.Rect({
      left: (fabricCanvas.getWidth() - width) / 2,
      top: (fabricCanvas.getHeight() - height) / 2,
      width: width,
      height: height,
      fill: 'transparent',
      borderColor: '#fff',
      cornerColor: '#fff',
      cornerSize: 12,
      stroke: '#fff',
      strokeDashArray: [10, 5],
      strokeWidth: 2,
      transparentCorners: false,
      lockRotation: true,
    });

    fabricCanvas.add(rect);
    fabricCanvas.setActiveObject(rect);
    setCropRect(rect);
    fabricCanvas.requestRenderAll();
  };

  const performCrop = () => {
    if (!fabricCanvas || !cropRect) return;
    cropRect.visible = false;
    
    const croppedDataUrl = fabricCanvas.toDataURL({
      left: cropRect.left,
      top: cropRect.top,
      width: cropRect.getScaledWidth(),
      height: cropRect.getScaledHeight(),
      format: 'png'
    });

    loadImageToCanvas(fabricCanvas, croppedDataUrl);
    cancelCrop(); 
  };

  const cancelCrop = () => {
    if (!fabricCanvas || !cropRect) return;
    fabricCanvas.remove(cropRect);
    setCropRect(null);
    setIsCropping(false);
    setActiveTool(null);
    fabricCanvas.requestRenderAll();
  };

  // --- SAVE ---
  const handleSave = () => {
    if (!fabricCanvas) return;
    fabricCanvas.discardActiveObject();
    fabricCanvas.requestRenderAll();

    const dataUrl = fabricCanvas.toDataURL({
      format: 'jpeg',
      quality: 0.9,
      multiplier: 2
    });

    fetch(dataUrl)
      .then(res => res.blob())
      .then(blob => onSave(blob));
  };

  // Update Settings Effect (Color/Size)
  useEffect(() => {
    if (!fabricCanvas) return;

    if (fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = brushColor;
      fabricCanvas.freeDrawingBrush.width = brushSize;
    }

    const activeObj = fabricCanvas.getActiveObject();
    if (activeObj) {
      // If Text or Shape -> Change Fill
      if (activeObj.type === 'i-text' || activeObj.type === 'text' || activeObj.type === 'rect' || activeObj.type === 'circle') {
        if(activeTool !== 'crop') {
           activeObj.set('fill', brushColor);
        }
      }
      fabricCanvas.requestRenderAll();
    }
  }, [brushColor, brushSize, fabricCanvas, activeTool]);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#000' }}>
      
      {/* HEADER - BOTÃO DE SALVAR AQUI EM CIMA */}
      <div style={{ 
        padding: '10px 15px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: 'max(15px, env(safe-area-inset-top))',
        borderBottom: '1px solid #222',
        background: '#000',
        zIndex: 10
      }}>
        <IonButton fill="clear" color="light" onClick={onCancel}>
          <IonIcon icon={closeOutline} />
        </IonButton>
        
        {/* Título Centralizado (Opcional) */}
        {/* <div style={{ color: 'white', fontWeight: 'bold' }}>Editor</div> */}

      </div>

      {/* CANVAS */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#111' }}>
        <canvas ref={canvasRef} />
      </div>

      {/* TOOLBAR AREA */}
      <div style={{ 
        background: '#000', 
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        borderTop: '1px solid #222',
        zIndex: 10
      }}>
        
        {/* --- CROP MODE CONTROLS --- */}
        {isCropping ? (
          <div style={{ padding: 15, display: 'flex', justifyContent: 'space-around' }}>
             <IonButton color="danger" fill="outline" onClick={cancelCrop}>
               Cancelar
             </IonButton>
             <IonButton color="success" onClick={performCrop}>
               Confirmar Recorte
               <IonIcon slot="end" icon={cutOutline} />
             </IonButton>
          </div>
        ) : (
          <>
            {/* --- CONTEXTUAL SETTINGS --- */}
            <div style={{ 
              padding: '10px 15px', 
              background: '#111', 
              display: 'flex', 
              gap: 15, 
              alignItems: 'center',
              overflowX: 'auto',
              minHeight: '60px' 
            }}>
              
              {/* Color Picker */}
              <input 
                type="color" 
                value={brushColor} 
                onChange={e => setBrushColor(e.target.value)} 
                style={{ 
                  width: 32, height: 32, padding: 0, border: '2px solid #444', 
                  borderRadius: '50%', background: 'none', cursor: 'pointer',
                  flexShrink: 0
                }} 
              />

              {/* Shapes Options */}
              {activeTool === 'shapes' ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <IonButton size="small" fill="outline" onClick={() => addShape('rect')}>
                    <IonIcon icon={squareOutline} slot="start" />
                    Quadrado
                  </IonButton>
                  <IonButton size="small" fill="outline" onClick={() => addShape('circle')}>
                    <IonIcon icon={ellipseOutline} slot="start" />
                    Círculo
                  </IonButton>
                </div>
              ) : (
                /* Size Slider (Default for Draw/Text) */
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: 100 }}>
                  <IonIcon icon={brushOutline} size="small" style={{ marginRight: 5, opacity: 0.5 }} />
                  <IonRange 
                    min={1} max={60} value={brushSize} 
                    onIonChange={e => setBrushSize(e.detail.value)}
                    style={{ '--height': '30px', padding: 0 }}
                  />
                </div>
              )}

              {/* Font Selector */}
              {activeTool === 'text' && (
                 <div style={{ marginLeft: 10 }}>
                   <IonButton 
                     size="small" 
                     fill="solid" 
                     color="medium"
                     onClick={() => {
                       const currentIndex = FONTS.indexOf(selectedFont);
                       const nextIndex = (currentIndex + 1) % FONTS.length;
                       changeFont(FONTS[nextIndex]);
                     }}
                   >
                     <IonIcon icon={textOutline} slot="start" />
                     {selectedFont}
                   </IonButton>
                 </div>
              )}
            </div>

            {/* --- MAIN BUTTONS --- */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', overflowX: 'auto', gap: 10 }}>
              
              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                <IonButton 
                  fill={activeTool === 'draw' ? 'solid' : 'clear'} 
                  color={activeTool === 'draw' ? 'primary' : 'light'} 
                  onClick={toggleDrawing}
                >
                  <IonIcon icon={brushOutline} />
                </IonButton>
                
                <IonButton 
                  fill={activeTool === 'text' ? 'solid' : 'clear'} 
                  color={activeTool === 'text' ? 'primary' : 'light'} 
                  onClick={addText}
                >
                  <IonIcon icon={textOutline} />
                </IonButton>

                <IonButton 
                  fill={activeTool === 'shapes' ? 'solid' : 'clear'} 
                  color={activeTool === 'shapes' ? 'primary' : 'light'} 
                  onClick={toggleShapes}
                >
                  <IonIcon icon={shapesOutline} />
                </IonButton>

                <IonButton fill="clear" color="light" onClick={startCrop}>
                  <IonIcon icon={cropOutline} />
                </IonButton>
              </div>

              <div style={{ width: 1, background: '#333', margin: '0 5px', flexShrink: 0 }}></div>

              <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                <IonButton fill="clear" color="medium" onClick={() => loadHistory(historyIndex - 1)} disabled={historyIndex <= 0}>
                  <IonIcon icon={arrowUndoOutline} />
                </IonButton>
                <IonButton fill="clear" color="medium" onClick={() => loadHistory(historyIndex + 1)} disabled={historyIndex >= history.length - 1}>
                  <IonIcon icon={arrowRedoOutline} />
                </IonButton>
                <IonButton fill="clear" color="danger" onClick={deleteSelected}>
                  <IonIcon icon={trashOutline} />
                </IonButton>
              </div>

            </div>

             {/* --- SAVE BUTTON ROW (FIXED BOTTOM) --- */}
            <div style={{ padding: '5px 15px', borderTop: '1px solid #222' }}>
              <IonButton expand="block" onClick={handleSave} color="primary" fill="solid" shape="round">
                 <IonIcon icon={checkmarkOutline} slot="start" />
                 Salvar Edição
              </IonButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FabricImageEditor;
