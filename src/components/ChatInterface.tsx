import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Loader2, Download, FileText, ExternalLink, Check, RefreshCw, Globe, RotateCcw } from "lucide-react";

// Typing Animation Hook
const useTypingAnimation = (text: string, speed: number = 30, enabled: boolean = true) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    setDisplayedText("");
    setIsTyping(true);
    let currentIndex = 0;

    const timer = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, enabled]);

  return { displayedText, isTyping };
};

// Typing Message Component
const TypingMessage = ({ message, onComplete }: { message: string; onComplete?: () => void }) => {
  const { displayedText, isTyping } = useTypingAnimation(message, 25, true);

  useEffect(() => {
    if (!isTyping && onComplete) {
      onComplete();
    }
  }, [isTyping, onComplete]);

  return (
    <p className="text-lg text-gray-800 leading-relaxed">
      {displayedText}
      {isTyping && (
        <span className="inline-block w-0.5 h-5 bg-orange-400 ml-1 animate-pulse" />
      )}
    </p>
  );
};
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// ==================== Translations ====================

type LanguageCode = "en" | "ja" | "th" | "es" | "pt" | "de" | "fr";

interface Translations {
  layoutQuestion: string;
  layoutConfirmProduct: string;
  layoutConfirmLifestyle: string;
  channelQuestion: string;
  copyQuestion: string;
  imageTypeQuestion: string;
  yesIncludeProduct: string;
  noWithoutProduct: string;
  productDescription: string;
  lifestyleDescription: string;
  pdpQuestion: string;
  pdpConfirmQuestion: string;
  lifestyleQuestionWithProduct: string;
  lifestyleQuestionWithoutProduct: string;
  generatingLifestyle: string;
  lifestylePreviewQuestion: string;
  generatingFinal: string;
  finalComplete: string;
  rateLimitError: string;
  genericError: string;
  selectOther: string;
  confirmProceed: string;
  selectionComplete: string;
  next: string;
  useThis: string;
  regenerate: string;
  retry: string;
  startOver: string;
  goHome: string;
  downloadPng: string;
  downloadSvg: string;
  openInFigma: string;
  headlinePlaceholder: string;
  subcopyPlaceholder: string;
  ctaPlaceholder: string;
  pdpPlaceholder: string;
  lifestylePlaceholder: string;
  getImage: string;
  generateImage: string;
  proceedWithoutProduct: string;
  inputCopy: string;
  comingSoon: string;
  step: string;
  preparing: string;
  syncing: string;
  combiningAssets: string;
  lifestyleSuggestions: string[];
}

const translations: Record<LanguageCode, Translations> = {
  en: {
    layoutQuestion: "Hi there! Which layout would you like to use for your promotional content?",
    layoutConfirmProduct: "You selected {name}! This layout requires both product and lifestyle images. Would you like to proceed?",
    layoutConfirmLifestyle: "You selected {name}! This layout uses only lifestyle images. Would you like to proceed?",
    channelQuestion: "Which channels do you need banners for? You can select multiple.",
    copyQuestion: "Please enter the copy for your banners.",
    imageTypeQuestion: "Would you like to include a product in the lifestyle image?",
    yesIncludeProduct: "Yes, include product",
    noWithoutProduct: "No, without product",
    productDescription: "We'll fetch the product image from the PDP URL and display it with the lifestyle image.",
    lifestyleDescription: "We'll create a lifestyle image focused on people and environment.",
    pdpQuestion: "Please enter the product page (PDP) URL. We'll fetch the first gallery image.",
    pdpConfirmQuestion: "Would you like to use this product image?",
    lifestyleQuestionWithProduct: "What lifestyle scene would you like with the product? Please describe the scene.",
    lifestyleQuestionWithoutProduct: "What lifestyle scene would you like? We'll create an image focused on people and environment.",
    generatingLifestyle: "Generating the lifestyle image...",
    lifestylePreviewQuestion: "How about this image?",
    generatingFinal: "Creating your final banners...",
    finalComplete: "All done! Please review your final results.",
    rateLimitError: "Figma API is temporarily busy. Please try again in 1 minute.",
    genericError: "An error occurred. Please try again.",
    selectOther: "Select another layout",
    confirmProceed: "Confirm & Proceed",
    selectionComplete: "Selection Complete",
    next: "Next",
    useThis: "Use this",
    regenerate: "Regenerate",
    retry: "Retry",
    startOver: "Start Over",
    goHome: "Go to Home",
    downloadPng: "Download PNG",
    downloadSvg: "Download SVG",
    openInFigma: "Open in Figma",
    headlinePlaceholder: "Enter your main headline",
    subcopyPlaceholder: "Enter your subcopy",
    ctaPlaceholder: "CTA button text (e.g., Shop Now)",
    pdpPlaceholder: "https://example.com/product/...",
    lifestylePlaceholder: "e.g., Friends enjoying time at the beach under warm sunlight...",
    getImage: "Get Image",
    generateImage: "Generate Image",
    proceedWithoutProduct: "Proceed without product",
    inputCopy: "Entered Copy",
    comingSoon: "Coming Soon",
    step: "Step",
    preparing: "Preparing...",
    syncing: "Loading Figma template...",
    combiningAssets: "Combining copy and images...",
    lifestyleSuggestions: [
      "Relaxing at the beach",
      "Chatting with friends at a cafe",
      "Walking through city streets",
      "Picnic in the park",
      "Cozy relaxation at home"
    ]
  },
  ja: {
    layoutQuestion: "こんにちは！どのレイアウトでプロモーションコンテンツを作成しますか？",
    layoutConfirmProduct: "{name}を選択しました！このレイアウトは製品画像とライフスタイル画像の両方が必要です。続行しますか？",
    layoutConfirmLifestyle: "{name}を選択しました！このレイアウトはライフスタイル画像のみを使用します。続行しますか？",
    channelQuestion: "どのチャンネル用のバナーが必要ですか？複数選択できます。",
    copyQuestion: "バナーのコピーを入力してください。",
    imageTypeQuestion: "ライフスタイル画像に製品を含めますか？",
    yesIncludeProduct: "はい、製品を含める",
    noWithoutProduct: "いいえ、製品なし",
    productDescription: "PDP URLから製品画像を取得し、ライフスタイル画像と一緒に表示します。",
    lifestyleDescription: "人と環境に焦点を当てたライフスタイル画像を作成します。",
    pdpQuestion: "製品ページ（PDP）のURLを入力してください。最初のギャラリー画像を取得します。",
    pdpConfirmQuestion: "この製品画像を使用しますか？",
    lifestyleQuestionWithProduct: "製品と一緒にどんなライフスタイルシーンを希望しますか？シーンを説明してください。",
    lifestyleQuestionWithoutProduct: "どんなライフスタイルシーンを希望しますか？人と環境に焦点を当てた画像を作成します。",
    generatingLifestyle: "ライフスタイル画像を生成中...",
    lifestylePreviewQuestion: "この画像はいかがですか？",
    generatingFinal: "最終バナーを作成中...",
    finalComplete: "完了！最終結果をご確認ください。",
    rateLimitError: "Figma APIが一時的にビジーです。1分後にもう一度お試しください。",
    genericError: "エラーが発生しました。もう一度お試しください。",
    selectOther: "別のレイアウトを選択",
    confirmProceed: "確認して続行",
    selectionComplete: "選択完了",
    next: "次へ",
    useThis: "これを使用",
    regenerate: "再生成",
    retry: "再試行",
    startOver: "最初から",
    goHome: "ホームへ",
    downloadPng: "PNG ダウンロード",
    downloadSvg: "SVG ダウンロード",
    openInFigma: "Figmaで開く",
    headlinePlaceholder: "メインヘッドラインを入力",
    subcopyPlaceholder: "サブコピーを入力",
    ctaPlaceholder: "CTAボタンテキスト（例：今すぐ購入）",
    pdpPlaceholder: "https://example.com/product/...",
    lifestylePlaceholder: "例：暖かい日差しの下でビーチで友達と楽しい時間...",
    getImage: "画像を取得",
    generateImage: "画像を生成",
    proceedWithoutProduct: "製品なしで続行",
    inputCopy: "入力されたコピー",
    comingSoon: "近日公開",
    step: "ステップ",
    preparing: "準備中...",
    syncing: "Figmaテンプレートを読み込み中...",
    combiningAssets: "コピーと画像を合成中...",
    lifestyleSuggestions: [
      "ビーチでリラックス",
      "カフェで友達とおしゃべり",
      "街を散歩",
      "公園でピクニック",
      "家で快適にリラックス"
    ]
  },
  th: {
    layoutQuestion: "สวัสดีค่ะ! คุณต้องการใช้เลย์เอาต์แบบใดสำหรับเนื้อหาโปรโมชั่น?",
    layoutConfirmProduct: "คุณเลือก {name}! เลย์เอาต์นี้ต้องใช้ทั้งภาพสินค้าและภาพไลฟ์สไตล์ ต้องการดำเนินการต่อหรือไม่?",
    layoutConfirmLifestyle: "คุณเลือก {name}! เลย์เอาต์นี้ใช้เฉพาะภาพไลฟ์สไตล์ ต้องการดำเนินการต่อหรือไม่?",
    channelQuestion: "คุณต้องการแบนเนอร์สำหรับช่องทางใด? สามารถเลือกได้หลายรายการ",
    copyQuestion: "กรุณาใส่ข้อความสำหรับแบนเนอร์",
    imageTypeQuestion: "คุณต้องการรวมสินค้าในภาพไลฟ์สไตล์หรือไม่?",
    yesIncludeProduct: "ใช่ รวมสินค้า",
    noWithoutProduct: "ไม่ ไม่ต้องมีสินค้า",
    productDescription: "เราจะดึงภาพสินค้าจาก URL PDP และแสดงพร้อมกับภาพไลฟ์สไตล์",
    lifestyleDescription: "เราจะสร้างภาพไลฟ์สไตล์ที่เน้นคนและสภาพแวดล้อม",
    pdpQuestion: "กรุณาใส่ URL หน้าสินค้า (PDP) เราจะดึงภาพแกลเลอรีแรก",
    pdpConfirmQuestion: "คุณต้องการใช้ภาพสินค้านี้หรือไม่?",
    lifestyleQuestionWithProduct: "คุณต้องการฉากไลฟ์สไตล์แบบใดกับสินค้า? กรุณาอธิบายฉาก",
    lifestyleQuestionWithoutProduct: "คุณต้องการฉากไลฟ์สไตล์แบบใด? เราจะสร้างภาพที่เน้นคนและสภาพแวดล้อม",
    generatingLifestyle: "กำลังสร้างภาพไลฟ์สไตล์...",
    lifestylePreviewQuestion: "ภาพนี้เป็นอย่างไรบ้าง?",
    generatingFinal: "กำลังสร้างแบนเนอร์สุดท้าย...",
    finalComplete: "เสร็จสิ้น! กรุณาตรวจสอบผลลัพธ์สุดท้าย",
    rateLimitError: "Figma API ไม่ว่างชั่วคราว กรุณาลองใหม่ใน 1 นาที",
    genericError: "เกิดข้อผิดพลาด กรุณาลองใหม่",
    selectOther: "เลือกเลย์เอาต์อื่น",
    confirmProceed: "ยืนยันและดำเนินการต่อ",
    selectionComplete: "เลือกเสร็จสิ้น",
    next: "ถัดไป",
    useThis: "ใช้สิ่งนี้",
    regenerate: "สร้างใหม่",
    retry: "ลองใหม่",
    startOver: "เริ่มต้นใหม่",
    goHome: "ไปหน้าหลัก",
    downloadPng: "ดาวน์โหลด PNG",
    downloadSvg: "ดาวน์โหลด SVG",
    openInFigma: "เปิดใน Figma",
    headlinePlaceholder: "ใส่พาดหัวหลัก",
    subcopyPlaceholder: "ใส่ข้อความรอง",
    ctaPlaceholder: "ข้อความปุ่ม CTA (เช่น ซื้อเลย)",
    pdpPlaceholder: "https://example.com/product/...",
    lifestylePlaceholder: "เช่น เพื่อนๆ เพลิดเพลินกับเวลาที่ชายหาดใต้แสงแดดอบอุ่น...",
    getImage: "ดึงภาพ",
    generateImage: "สร้างภาพ",
    proceedWithoutProduct: "ดำเนินการต่อโดยไม่มีสินค้า",
    inputCopy: "ข้อความที่ใส่",
    comingSoon: "เร็วๆ นี้",
    step: "ขั้นตอน",
    preparing: "กำลังเตรียม...",
    syncing: "กำลังโหลดเทมเพลต Figma...",
    combiningAssets: "กำลังรวมข้อความและภาพ...",
    lifestyleSuggestions: [
      "พักผ่อนที่ชายหาด",
      "พูดคุยกับเพื่อนที่คาเฟ่",
      "เดินเล่นในเมือง",
      "ปิกนิกในสวน",
      "พักผ่อนอย่างสบายที่บ้าน"
    ]
  },
  es: {
    layoutQuestion: "¡Hola! ¿Qué diseño te gustaría usar para tu contenido promocional?",
    layoutConfirmProduct: "¡Seleccionaste {name}! Este diseño requiere imágenes de producto y estilo de vida. ¿Deseas continuar?",
    layoutConfirmLifestyle: "¡Seleccionaste {name}! Este diseño usa solo imágenes de estilo de vida. ¿Deseas continuar?",
    channelQuestion: "¿Para qué canales necesitas banners? Puedes seleccionar varios.",
    copyQuestion: "Por favor ingresa el texto para tus banners.",
    imageTypeQuestion: "¿Te gustaría incluir un producto en la imagen de estilo de vida?",
    yesIncludeProduct: "Sí, incluir producto",
    noWithoutProduct: "No, sin producto",
    productDescription: "Obtendremos la imagen del producto desde la URL del PDP y la mostraremos con la imagen de estilo de vida.",
    lifestyleDescription: "Crearemos una imagen de estilo de vida enfocada en personas y ambiente.",
    pdpQuestion: "Por favor ingresa la URL de la página del producto (PDP). Obtendremos la primera imagen de la galería.",
    pdpConfirmQuestion: "¿Te gustaría usar esta imagen de producto?",
    lifestyleQuestionWithProduct: "¿Qué escena de estilo de vida te gustaría con el producto? Por favor describe la escena.",
    lifestyleQuestionWithoutProduct: "¿Qué escena de estilo de vida te gustaría? Crearemos una imagen enfocada en personas y ambiente.",
    generatingLifestyle: "Generando la imagen de estilo de vida...",
    lifestylePreviewQuestion: "¿Qué te parece esta imagen?",
    generatingFinal: "Creando tus banners finales...",
    finalComplete: "¡Listo! Por favor revisa tus resultados finales.",
    rateLimitError: "La API de Figma está temporalmente ocupada. Por favor intenta de nuevo en 1 minuto.",
    genericError: "Ocurrió un error. Por favor intenta de nuevo.",
    selectOther: "Seleccionar otro diseño",
    confirmProceed: "Confirmar y Continuar",
    selectionComplete: "Selección Completa",
    next: "Siguiente",
    useThis: "Usar esto",
    regenerate: "Regenerar",
    retry: "Reintentar",
    startOver: "Empezar de Nuevo",
    goHome: "Ir al Inicio",
    downloadPng: "Descargar PNG",
    downloadSvg: "Descargar SVG",
    openInFigma: "Abrir en Figma",
    headlinePlaceholder: "Ingresa tu titular principal",
    subcopyPlaceholder: "Ingresa tu subtexto",
    ctaPlaceholder: "Texto del botón CTA (ej., Comprar Ahora)",
    pdpPlaceholder: "https://example.com/product/...",
    lifestylePlaceholder: "ej., Amigos disfrutando en la playa bajo la cálida luz del sol...",
    getImage: "Obtener Imagen",
    generateImage: "Generar Imagen",
    proceedWithoutProduct: "Continuar sin producto",
    inputCopy: "Texto Ingresado",
    comingSoon: "Próximamente",
    step: "Paso",
    preparing: "Preparando...",
    syncing: "Cargando plantilla de Figma...",
    combiningAssets: "Combinando texto e imágenes...",
    lifestyleSuggestions: [
      "Relajándose en la playa",
      "Charlando con amigos en un café",
      "Paseando por las calles de la ciudad",
      "Picnic en el parque",
      "Relajación acogedora en casa"
    ]
  },
  pt: {
    layoutQuestion: "Olá! Qual layout você gostaria de usar para seu conteúdo promocional?",
    layoutConfirmProduct: "Você selecionou {name}! Este layout requer imagens de produto e estilo de vida. Deseja continuar?",
    layoutConfirmLifestyle: "Você selecionou {name}! Este layout usa apenas imagens de estilo de vida. Deseja continuar?",
    channelQuestion: "Para quais canais você precisa de banners? Você pode selecionar vários.",
    copyQuestion: "Por favor, insira o texto para seus banners.",
    imageTypeQuestion: "Você gostaria de incluir um produto na imagem de estilo de vida?",
    yesIncludeProduct: "Sim, incluir produto",
    noWithoutProduct: "Não, sem produto",
    productDescription: "Buscaremos a imagem do produto da URL do PDP e exibiremos com a imagem de estilo de vida.",
    lifestyleDescription: "Criaremos uma imagem de estilo de vida focada em pessoas e ambiente.",
    pdpQuestion: "Por favor, insira a URL da página do produto (PDP). Buscaremos a primeira imagem da galeria.",
    pdpConfirmQuestion: "Você gostaria de usar esta imagem do produto?",
    lifestyleQuestionWithProduct: "Qual cena de estilo de vida você gostaria com o produto? Por favor descreva a cena.",
    lifestyleQuestionWithoutProduct: "Qual cena de estilo de vida você gostaria? Criaremos uma imagem focada em pessoas e ambiente.",
    generatingLifestyle: "Gerando a imagem de estilo de vida...",
    lifestylePreviewQuestion: "O que acha desta imagem?",
    generatingFinal: "Criando seus banners finais...",
    finalComplete: "Pronto! Por favor revise seus resultados finais.",
    rateLimitError: "A API do Figma está temporariamente ocupada. Por favor tente novamente em 1 minuto.",
    genericError: "Ocorreu um erro. Por favor tente novamente.",
    selectOther: "Selecionar outro layout",
    confirmProceed: "Confirmar e Continuar",
    selectionComplete: "Seleção Completa",
    next: "Próximo",
    useThis: "Usar isso",
    regenerate: "Regenerar",
    retry: "Tentar Novamente",
    startOver: "Recomeçar",
    goHome: "Ir para Início",
    downloadPng: "Baixar PNG",
    downloadSvg: "Baixar SVG",
    openInFigma: "Abrir no Figma",
    headlinePlaceholder: "Insira seu título principal",
    subcopyPlaceholder: "Insira seu subtexto",
    ctaPlaceholder: "Texto do botão CTA (ex., Compre Agora)",
    pdpPlaceholder: "https://example.com/product/...",
    lifestylePlaceholder: "ex., Amigos aproveitando na praia sob a luz quente do sol...",
    getImage: "Obter Imagem",
    generateImage: "Gerar Imagem",
    proceedWithoutProduct: "Continuar sem produto",
    inputCopy: "Texto Inserido",
    comingSoon: "Em Breve",
    step: "Passo",
    preparing: "Preparando...",
    syncing: "Carregando template do Figma...",
    combiningAssets: "Combinando texto e imagens...",
    lifestyleSuggestions: [
      "Relaxando na praia",
      "Conversando com amigos em um café",
      "Passeando pelas ruas da cidade",
      "Piquenique no parque",
      "Relaxamento aconchegante em casa"
    ]
  },
  de: {
    layoutQuestion: "Hallo! Welches Layout möchtest du für deinen Werbeinhalt verwenden?",
    layoutConfirmProduct: "Du hast {name} ausgewählt! Dieses Layout erfordert sowohl Produkt- als auch Lifestyle-Bilder. Möchtest du fortfahren?",
    layoutConfirmLifestyle: "Du hast {name} ausgewählt! Dieses Layout verwendet nur Lifestyle-Bilder. Möchtest du fortfahren?",
    channelQuestion: "Für welche Kanäle benötigst du Banner? Du kannst mehrere auswählen.",
    copyQuestion: "Bitte gib den Text für deine Banner ein.",
    imageTypeQuestion: "Möchtest du ein Produkt im Lifestyle-Bild einbeziehen?",
    yesIncludeProduct: "Ja, Produkt einbeziehen",
    noWithoutProduct: "Nein, ohne Produkt",
    productDescription: "Wir holen das Produktbild von der PDP-URL und zeigen es mit dem Lifestyle-Bild an.",
    lifestyleDescription: "Wir erstellen ein Lifestyle-Bild mit Fokus auf Menschen und Umgebung.",
    pdpQuestion: "Bitte gib die Produktseiten-URL (PDP) ein. Wir holen das erste Galeriebild.",
    pdpConfirmQuestion: "Möchtest du dieses Produktbild verwenden?",
    lifestyleQuestionWithProduct: "Welche Lifestyle-Szene möchtest du mit dem Produkt? Bitte beschreibe die Szene.",
    lifestyleQuestionWithoutProduct: "Welche Lifestyle-Szene möchtest du? Wir erstellen ein Bild mit Fokus auf Menschen und Umgebung.",
    generatingLifestyle: "Lifestyle-Bild wird generiert...",
    lifestylePreviewQuestion: "Wie findest du dieses Bild?",
    generatingFinal: "Deine finalen Banner werden erstellt...",
    finalComplete: "Fertig! Bitte überprüfe deine Endergebnisse.",
    rateLimitError: "Figma API ist vorübergehend beschäftigt. Bitte versuche es in 1 Minute erneut.",
    genericError: "Ein Fehler ist aufgetreten. Bitte versuche es erneut.",
    selectOther: "Anderes Layout wählen",
    confirmProceed: "Bestätigen & Fortfahren",
    selectionComplete: "Auswahl Abgeschlossen",
    next: "Weiter",
    useThis: "Dies verwenden",
    regenerate: "Neu generieren",
    retry: "Erneut versuchen",
    startOver: "Neu beginnen",
    goHome: "Zur Startseite",
    downloadPng: "PNG herunterladen",
    downloadSvg: "SVG herunterladen",
    openInFigma: "In Figma öffnen",
    headlinePlaceholder: "Gib deine Hauptüberschrift ein",
    subcopyPlaceholder: "Gib deinen Untertext ein",
    ctaPlaceholder: "CTA-Button-Text (z.B., Jetzt kaufen)",
    pdpPlaceholder: "https://example.com/product/...",
    lifestylePlaceholder: "z.B., Freunde genießen Zeit am Strand unter warmem Sonnenlicht...",
    getImage: "Bild holen",
    generateImage: "Bild generieren",
    proceedWithoutProduct: "Ohne Produkt fortfahren",
    inputCopy: "Eingegebener Text",
    comingSoon: "Demnächst",
    step: "Schritt",
    preparing: "Vorbereitung...",
    syncing: "Figma-Vorlage wird geladen...",
    combiningAssets: "Text und Bilder werden kombiniert...",
    lifestyleSuggestions: [
      "Entspannung am Strand",
      "Mit Freunden im Café plaudern",
      "Durch die Straßen der Stadt spazieren",
      "Picknick im Park",
      "Gemütliche Entspannung zu Hause"
    ]
  },
  fr: {
    layoutQuestion: "Bonjour ! Quel layout souhaitez-vous utiliser pour votre contenu promotionnel ?",
    layoutConfirmProduct: "Vous avez sélectionné {name} ! Ce layout nécessite des images de produit et de style de vie. Voulez-vous continuer ?",
    layoutConfirmLifestyle: "Vous avez sélectionné {name} ! Ce layout utilise uniquement des images de style de vie. Voulez-vous continuer ?",
    channelQuestion: "Pour quels canaux avez-vous besoin de bannières ? Vous pouvez en sélectionner plusieurs.",
    copyQuestion: "Veuillez entrer le texte pour vos bannières.",
    imageTypeQuestion: "Souhaitez-vous inclure un produit dans l'image de style de vie ?",
    yesIncludeProduct: "Oui, inclure le produit",
    noWithoutProduct: "Non, sans produit",
    productDescription: "Nous récupérerons l'image du produit depuis l'URL PDP et l'afficherons avec l'image de style de vie.",
    lifestyleDescription: "Nous créerons une image de style de vie axée sur les personnes et l'environnement.",
    pdpQuestion: "Veuillez entrer l'URL de la page produit (PDP). Nous récupérerons la première image de la galerie.",
    pdpConfirmQuestion: "Souhaitez-vous utiliser cette image de produit ?",
    lifestyleQuestionWithProduct: "Quelle scène de style de vie souhaitez-vous avec le produit ? Veuillez décrire la scène.",
    lifestyleQuestionWithoutProduct: "Quelle scène de style de vie souhaitez-vous ? Nous créerons une image axée sur les personnes et l'environnement.",
    generatingLifestyle: "Génération de l'image de style de vie...",
    lifestylePreviewQuestion: "Que pensez-vous de cette image ?",
    generatingFinal: "Création de vos bannières finales...",
    finalComplete: "Terminé ! Veuillez vérifier vos résultats finaux.",
    rateLimitError: "L'API Figma est temporairement occupée. Veuillez réessayer dans 1 minute.",
    genericError: "Une erreur s'est produite. Veuillez réessayer.",
    selectOther: "Sélectionner un autre layout",
    confirmProceed: "Confirmer et Continuer",
    selectionComplete: "Sélection Terminée",
    next: "Suivant",
    useThis: "Utiliser ceci",
    regenerate: "Régénérer",
    retry: "Réessayer",
    startOver: "Recommencer",
    goHome: "Aller à l'Accueil",
    downloadPng: "Télécharger PNG",
    downloadSvg: "Télécharger SVG",
    openInFigma: "Ouvrir dans Figma",
    headlinePlaceholder: "Entrez votre titre principal",
    subcopyPlaceholder: "Entrez votre sous-texte",
    ctaPlaceholder: "Texte du bouton CTA (ex., Acheter Maintenant)",
    pdpPlaceholder: "https://example.com/product/...",
    lifestylePlaceholder: "ex., Des amis profitant du temps à la plage sous la chaleur du soleil...",
    getImage: "Obtenir l'Image",
    generateImage: "Générer l'Image",
    proceedWithoutProduct: "Continuer sans produit",
    inputCopy: "Texte Saisi",
    comingSoon: "Bientôt Disponible",
    step: "Étape",
    preparing: "Préparation...",
    syncing: "Chargement du modèle Figma...",
    combiningAssets: "Combinaison du texte et des images...",
    lifestyleSuggestions: [
      "Détente à la plage",
      "Discussion entre amis dans un café",
      "Promenade dans les rues de la ville",
      "Pique-nique au parc",
      "Détente confortable à la maison"
    ]
  }
};

const LANGUAGE_OPTIONS: { code: LanguageCode; name: string; flag: string }[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "th", name: "ไทย", flag: "🇹🇭" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];
import { supabase } from "@/integrations/supabase/client";

// ==================== Types ====================

type Phase = 
  | "loading"
  | "layout-select"
  | "layout-confirm"
  | "channel-select"
  | "syncing"
  | "copy-collect"
  | "image-type-select"
  | "pdp-input"
  | "pdp-preview"
  | "lifestyle-input"
  | "lifestyle-generating"
  | "lifestyle-preview"
  | "final-generating"
  | "final-preview"
  | "completed"
  | "error";

interface LayoutOption {
  id: "A" | "B" | "C" | "D" | "E";
  name: string;
  description: string;
  thumbnail: string;
  available: boolean;
  requiresProduct: boolean;
}

interface WizardState {
  selectedLayout: "A" | "B" | null;
  selectedChannels: string[];
  copyInputs: {
    headline: string;
    subcopy: string;
    cta: string;
  };
  includeProduct: boolean;
  pdpUrl: string;
  productImageUrl: string | null;
  lifestyleDescription: string;
  lifestyleImageUrl: string | null;
}

interface FigmaLayer {
  id: string;
  name: string;
  type: "TEXT" | "IMAGE" | "COMPONENT";
  currentValue: string | null;
  path: string;
}

interface FigmaData {
  fileName: string;
  fileKey: string;
  layers: FigmaLayer[];
}

interface ChatHistoryItem {
  phase: Phase;
  question: string;
  answer: string;
  wizardStateSnapshot: WizardState;
}

// ==================== Constants ====================

const LAYOUT_OPTIONS: LayoutOption[] = [
  {
    id: "A",
    name: "Type A",
    description: "1 Lifestyle image with product",
    thumbnail: "/layout-type-a.jpg",
    available: true,
    requiresProduct: true,
  },
  {
    id: "B",
    name: "Type B",
    description: "1 Product image + 1 Lifestyle image",
    thumbnail: "/layout-type-b.jpg",
    available: false, // Coming soon
    requiresProduct: false,
  },
  {
    id: "C",
    name: "Type C",
    description: "Coming Soon",
    thumbnail: "",
    available: false,
    requiresProduct: false,
  },
  {
    id: "D",
    name: "Type D",
    description: "Coming Soon",
    thumbnail: "",
    available: false,
    requiresProduct: false,
  },
  {
    id: "E",
    name: "Type E",
    description: "Coming Soon",
    thumbnail: "",
    available: false,
    requiresProduct: false,
  },
];

const CHANNELS = [
  { id: "criteo", name: "Criteo", keywords: ["criteo"] },
  { id: "dv360", name: "DV360", keywords: ["dv360", "dv 360", "display"] },
  { id: "social", name: "Social", keywords: ["social", "facebook", "instagram", "meta"] },
  { id: "email", name: "Email (CRM)", keywords: ["email", "edm", "newsletter", "crm"] },
];

// LIFESTYLE_SUGGESTIONS moved to translations

// ==================== Component ====================

const ChatInterface = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Language
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>("en");
  const t = translations[currentLanguage];

  // Phase & Loading
  const [phase, setPhase] = useState<Phase>("loading");
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Figma Data
  const [figmaData, setFigmaData] = useState<FigmaData | null>(null);
  const [filteredLayers, setFilteredLayers] = useState<FigmaLayer[]>([]);

  // Wizard State
  const [wizardState, setWizardState] = useState<WizardState>({
    selectedLayout: null,
    selectedChannels: [],
    copyInputs: {
      headline: "",
      subcopy: "",
      cta: "",
    },
    includeProduct: false,
    pdpUrl: "",
    productImageUrl: null,
    lifestyleDescription: "",
    lifestyleImageUrl: null,
  });

  // Export State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Chat History State
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);

  // Add to history function
  const addToHistory = (phase: Phase, question: string, answer: string) => {
    setChatHistory(prev => [...prev, {
      phase,
      question,
      answer,
      wizardStateSnapshot: { ...wizardState }
    }]);
  };

  // Go back to a specific phase
  const goBackToPhase = (targetIndex: number) => {
    const targetItem = chatHistory[targetIndex];
    if (targetItem) {
      setChatHistory(prev => prev.slice(0, targetIndex));
      setWizardState(targetItem.wizardStateSnapshot);
      setPhase(targetItem.phase);
    }
  };

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [phase]);

  // Initialize
  useEffect(() => {
    // Start with channel selection first
    setTimeout(() => {
      setPhase("channel-select");
    }, 1000);
  }, []);

  // ==================== Phase Handlers ====================

  const handleLayoutSelect = (layoutId: "A" | "B") => {
    const layout = LAYOUT_OPTIONS.find((l) => l.id === layoutId);
    if (!layout?.available) {
      toast({
        title: t.comingSoon,
        description: t.comingSoon,
      });
      return;
    }
    setWizardState((prev) => ({ ...prev, selectedLayout: layoutId }));
    setPhase("layout-confirm");
  };

  const handleLayoutConfirm = async () => {
    // Add to history
    const selectedLayout = LAYOUT_OPTIONS.find(l => l.id === wizardState.selectedLayout);
    addToHistory("layout-confirm", t.layoutQuestion, selectedLayout?.name || "");

    // After layout confirm, sync Figma (for Type A) or proceed to copy
    if (wizardState.selectedLayout === "A") {
      setPhase("syncing");
      await loadFigmaLayers();
    } else {
      setPhase("copy-collect");
    }
  };

  const handleChannelToggle = (channelId: string) => {
    setWizardState((prev) => ({
      ...prev,
      selectedChannels: prev.selectedChannels.includes(channelId)
        ? prev.selectedChannels.filter((c) => c !== channelId)
        : [...prev.selectedChannels, channelId],
    }));
  };

  const handleChannelConfirm = () => {
    if (wizardState.selectedChannels.length === 0) {
      toast({
        title: "Channel Required",
        description: "Please select at least one channel.",
        variant: "destructive",
      });
      return;
    }

    // Add to history
    const selectedChannelNames = wizardState.selectedChannels
      .map(id => CHANNELS.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join(", ");
    addToHistory("channel-select", t.channelQuestion, selectedChannelNames);

    // After channel selection, proceed to layout selection
    setPhase("layout-select");
  };

  const loadFigmaLayers = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const { data, error } = await supabase.functions.invoke("yumi-figma-layers");

      if (error) throw error;

      if (!data.success) {
        if (data.errorCode === "RATE_LIMIT") {
          setLoadError("RATE_LIMIT");
          setPhase("error");
          // No auto-retry - user must manually retry after waiting
          return;
        }
        throw new Error(data.error || "Failed to load Figma layers");
      }

      setFigmaData(data);

      // Filter layers based on selected channels
      const selectedKeywords = CHANNELS.filter((c) =>
        wizardState.selectedChannels.includes(c.id)
      ).flatMap((c) => c.keywords);

      const editable = data.layers.filter(
        (l: FigmaLayer) => l.type === "TEXT" || l.type === "IMAGE"
      );

      const filtered = editable.filter((layer: FigmaLayer) => {
        const pathLower = layer.path.toLowerCase();
        return selectedKeywords.some((keyword) =>
          pathLower.includes(keyword.toLowerCase())
        );
      });

      setFilteredLayers(filtered);

      // Get current copy values from Figma
      const headlineLayer = filtered.find((l: FigmaLayer) =>
        l.name.toLowerCase().includes("copy_headline")
      );
      const subcopyLayer = filtered.find((l: FigmaLayer) =>
        l.name.toLowerCase().includes("copy_subcopy")
      );
      const ctaLayer = filtered.find((l: FigmaLayer) =>
        l.name.toLowerCase().includes("copy_cta")
      );

      setWizardState((prev) => ({
        ...prev,
        copyInputs: {
          headline: headlineLayer?.currentValue || "",
          subcopy: subcopyLayer?.currentValue || "",
          cta: ctaLayer?.currentValue || "",
        },
      }));

      setPhase("copy-collect");
    } catch (error: any) {
      console.error("Error loading Figma layers:", error);
      const isRateLimit =
        error.message?.includes("Rate limit") || error.message?.includes("429");

      if (isRateLimit) {
        setLoadError("RATE_LIMIT");
      } else {
        setLoadError("UNKNOWN");
      }
      setPhase("error");

      toast({
        title: "오류",
        description: error.message || "Figma 템플릿 로드 실패",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySubmit = async () => {
    const { headline, subcopy, cta } = wizardState.copyInputs;
    if (!headline.trim() || !subcopy.trim() || !cta.trim()) {
      toast({
        title: "입력 필요",
        description: "모든 카피 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update text variables in Figma (only for selected channels)
      const { data, error } = await supabase.functions.invoke(
        "yumi-figma-update-text",
        {
          body: {
            textUpdates: [
              { variableName: "headline", value: headline },
              { variableName: "subcopy", value: subcopy },
              { variableName: "cta", value: cta },
            ],
            selectedChannels: wizardState.selectedChannels,
          },
        }
      );

      if (error) {
        console.error("Error updating Figma text:", error);
        // Don't block the flow, just log the error
        toast({
          title: "Figma 업데이트 알림",
          description: "텍스트 업데이트를 시도했지만 일부 문제가 발생했습니다. 계속 진행합니다.",
          variant: "default",
        });
      } else if (data?.success) {
        console.log("Figma text updated successfully:", data);
        toast({
          title: "성공",
          description: `${data.updatedCount}개의 텍스트가 Figma에 업데이트되었습니다.`,
        });
      } else if (data?.error) {
        console.log("Figma text update info:", data);
        // Log available variables for debugging
        if (data.availableStringVariables) {
          console.log("Available STRING variables:", data.availableStringVariables);
        }
      }
    } catch (error: any) {
      console.error("Error updating Figma text:", error);
      // Continue anyway - don't block the user flow
    } finally {
      setIsLoading(false);
    }

    // Add to history
    addToHistory("copy-collect", t.copyQuestion, `${headline} / ${cta}`);
    setPhase("image-type-select");
  };

  const handleImageTypeSelect = (includeProduct: boolean) => {
    setWizardState((prev) => ({ ...prev, includeProduct }));
    // Add to history
    addToHistory("image-type-select", t.imageTypeQuestion, includeProduct ? t.yesIncludeProduct : t.noWithoutProduct);
    if (includeProduct) {
      setPhase("pdp-input");
    } else {
      setPhase("lifestyle-input");
    }
  };

  const handlePdpSubmit = async () => {
    if (!wizardState.pdpUrl.trim()) {
      toast({
        title: "URL 필요",
        description: "PDP URL을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "yumi-extract-pdp-image",
        {
          body: { pdpUrl: wizardState.pdpUrl },
        }
      );

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "이미지 추출 실패");
      }

      setWizardState((prev) => ({
        ...prev,
        productImageUrl: data.imageUrl,
      }));

      setPhase("pdp-preview");
    } catch (error: any) {
      console.error("Error extracting PDP image:", error);
      toast({
        title: "오류",
        description: error.message || "제품 이미지 추출 실패",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePdpConfirm = () => {
    // Add to history
    addToHistory("pdp-preview", t.pdpConfirmQuestion, "Product image selected");
    setPhase("lifestyle-input");
  };

  const handleLifestyleGenerate = async () => {
    if (!wizardState.lifestyleDescription.trim()) {
      toast({
        title: "입력 필요",
        description: "원하는 씬을 설명해주세요.",
        variant: "destructive",
      });
      return;
    }

    setPhase("lifestyle-generating");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "yumi-generate-lifestyle",
        {
          body: {
            sceneDescription: wizardState.lifestyleDescription,
            includeProduct: wizardState.includeProduct,
            productImageUrl: wizardState.productImageUrl,
            aspectRatio: "4:3",
          },
        }
      );

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "이미지 생성 실패");
      }

      setWizardState((prev) => ({
        ...prev,
        lifestyleImageUrl: data.imageUrl,
      }));

      setPhase("lifestyle-preview");
    } catch (error: any) {
      console.error("Error generating lifestyle image:", error);
      toast({
        title: "오류",
        description: error.message || "라이프스타일 이미지 생성 실패",
        variant: "destructive",
      });
      setPhase("lifestyle-input");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLifestyleConfirm = async () => {
    // Add to history
    addToHistory("lifestyle-preview", t.lifestylePreviewQuestion, wizardState.lifestyleDescription);
    
    setPhase("final-generating");
    
    // For now, just show the preview
    // In the future, this would apply images to Figma layers
    setTimeout(() => {
      setPhase("final-preview");
    }, 1500);
  };

  const handleRegenerateLifestyle = () => {
    setWizardState((prev) => ({
      ...prev,
      lifestyleImageUrl: null,
    }));
    setPhase("lifestyle-input");
  };

  const handleRetry = () => {
    setLoadError(null);
    setPhase("syncing");
    loadFigmaLayers();
  };

  const handleExport = async (format: "png" | "svg") => {
    setIsExporting(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "yumi-figma-export",
        {
          body: { format, scale: format === "png" ? 2 : 1 },
        }
      );

      if (error) throw error;

      if (data.success && data.exports.length > 0) {
        window.open(data.exports[0].imageUrl, "_blank");
        toast({
          title: "성공",
          description: `${format.toUpperCase()} 내보내기 완료!`,
        });
      }
    } catch (error: any) {
      console.error("Error downloading:", error);
      toast({
        title: "오류",
        description: "내보내기 실패",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const openInFigma = () => {
    if (figmaData) {
      window.open(`https://www.figma.com/file/${figmaData.fileKey}`, "_blank");
    }
  };

  const handleStartOver = () => {
    setWizardState({
      selectedLayout: null,
      selectedChannels: [],
      copyInputs: { headline: "", subcopy: "", cta: "" },
      includeProduct: false,
      pdpUrl: "",
      productImageUrl: null,
      lifestyleDescription: "",
      lifestyleImageUrl: null,
    });
    setPhase("channel-select");
    setFigmaData(null);
    setFilteredLayers([]);
    setPreviewUrl(null);
    setChatHistory([]); // Clear history on start over
  };

  // ==================== Step Indicator ====================

  const getStepNumber = () => {
    const steps: Phase[] = [
      "channel-select",
      "layout-select",
      "layout-confirm",
      "copy-collect",
      "image-type-select",
      "lifestyle-input",
      "final-preview",
    ];
    const currentIndex = steps.findIndex((s) => 
      phase === s || 
      (phase === "syncing" && s === "layout-confirm") ||
      (phase === "pdp-input" && s === "image-type-select") ||
      (phase === "pdp-preview" && s === "image-type-select") ||
      (phase === "lifestyle-generating" && s === "lifestyle-input") ||
      (phase === "lifestyle-preview" && s === "lifestyle-input") ||
      (phase === "final-generating" && s === "final-preview") ||
      (phase === "completed" && s === "final-preview")
    );
    return currentIndex + 1;
  };

  const totalSteps = 7;

  // ==================== Render Functions ====================

  const renderChatHistory = () => {
    if (chatHistory.length === 0) return null;

    return (
      <div className="space-y-3 mb-6 pb-4 border-b border-gray-200">
        {chatHistory.map((item, index) => (
          <div
            key={index}
            onClick={() => goBackToPhase(index)}
            className="flex items-start gap-3 p-3 bg-gray-100/70 rounded-xl cursor-pointer hover:bg-gray-200/70 transition-all duration-200 group animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <img
                src="/lovable-uploads/1d0546ae-2d59-40cf-a231-60343eecc72a.png"
                alt="Yumi"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 truncate">{item.question}</p>
              <p className="text-sm font-medium text-gray-800 truncate">{item.answer}</p>
            </div>
            <div className="flex items-center gap-1 text-gray-400 group-hover:text-orange-500 transition-colors">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderYumiMessage = (message: string, enableTyping: boolean = true) => (
    <div className="flex items-start gap-4 mb-6 animate-fade-in">
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
        <img
          src="/lovable-uploads/1d0546ae-2d59-40cf-a231-60343eecc72a.png"
          alt="Yumi"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1">
        {enableTyping ? (
          <TypingMessage message={message} />
        ) : (
          <p className="text-lg text-gray-800 leading-relaxed">{message}</p>
        )}
      </div>
    </div>
  );

  const renderLayoutSelect = () => (
    <div className="space-y-6">
      {renderYumiMessage(t.layoutQuestion)}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {LAYOUT_OPTIONS.map((layout) => (
          <div
            key={layout.id}
            onClick={() => layout.available && handleLayoutSelect(layout.id as "A" | "B")}
            className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
              layout.available
                ? "border-gray-200 hover:border-orange-400 hover:shadow-lg"
                : "border-gray-100 opacity-60 cursor-not-allowed"
            } ${wizardState.selectedLayout === layout.id ? "border-orange-400 ring-2 ring-orange-200" : ""}`}
          >
            <div className="aspect-[3/4] bg-gray-100">
              {layout.thumbnail ? (
                <img
                  src={layout.thumbnail}
                  alt={layout.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-sm">{t.comingSoon}</span>
                </div>
              )}
            </div>
            <div className="p-3 bg-white">
              <h4 className="font-semibold text-gray-900">{layout.name}</h4>
              <p className="text-sm text-gray-500">{layout.description}</p>
            </div>
            {!layout.available && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {t.comingSoon}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderLayoutConfirm = () => {
    const selectedLayout = LAYOUT_OPTIONS.find(
      (l) => l.id === wizardState.selectedLayout
    );

    return (
      <div className="space-y-6">
        {renderYumiMessage(
          selectedLayout?.requiresProduct
            ? t.layoutConfirmProduct.replace("{name}", selectedLayout?.name || "")
            : t.layoutConfirmLifestyle.replace("{name}", selectedLayout?.name || "")
        )}

        <div className="flex justify-center">
          <div className="w-64 rounded-xl overflow-hidden shadow-lg">
            <img
              src={selectedLayout?.thumbnail}
              alt={selectedLayout?.name}
              className="w-full h-auto"
            />
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setPhase("layout-select")}
            className="px-6"
          >
            {t.selectOther}
          </Button>
          <Button
            onClick={handleLayoutConfirm}
            className="bg-orange-400 hover:bg-orange-500 text-white px-8"
          >
            {t.confirmProceed}
          </Button>
        </div>
      </div>
    );
  };

  const renderChannelSelect = () => (
    <div className="space-y-6">
      {renderYumiMessage(t.channelQuestion)}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {CHANNELS.map((channel) => (
          <div
            key={channel.id}
            onClick={() => handleChannelToggle(channel.id)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
              wizardState.selectedChannels.includes(channel.id)
                ? "border-orange-400 bg-orange-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              {wizardState.selectedChannels.includes(channel.id) && (
                <Check className="w-5 h-5 text-orange-500" />
              )}
              <span className="font-medium text-gray-900">{channel.name}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleChannelConfirm}
          disabled={wizardState.selectedChannels.length === 0}
          className="bg-orange-400 hover:bg-orange-500 text-white px-8"
        >
          {t.selectionComplete} ({wizardState.selectedChannels.length})
        </Button>
      </div>
    </div>
  );

  const renderSyncing = () => (
    <div className="space-y-6">
      {renderYumiMessage(t.syncing)}
      
      <div className="flex justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
      </div>
    </div>
  );

  const renderCopyCollect = () => (
    <div className="space-y-6">
      {renderYumiMessage(t.copyQuestion)}

      <div className="space-y-4 max-w-lg mx-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Headline (Copy_Headline)
          </label>
          <Input
            value={wizardState.copyInputs.headline}
            onChange={(e) =>
              setWizardState((prev) => ({
                ...prev,
                copyInputs: { ...prev.copyInputs, headline: e.target.value },
              }))
            }
            placeholder={t.headlinePlaceholder}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subcopy (Copy_Subcopy)
          </label>
          <Textarea
            value={wizardState.copyInputs.subcopy}
            onChange={(e) =>
              setWizardState((prev) => ({
                ...prev,
                copyInputs: { ...prev.copyInputs, subcopy: e.target.value },
              }))
            }
            placeholder={t.subcopyPlaceholder}
            rows={2}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CTA (Copy_CTA_White)
          </label>
          <Input
            value={wizardState.copyInputs.cta}
            onChange={(e) =>
              setWizardState((prev) => ({
                ...prev,
                copyInputs: { ...prev.copyInputs, cta: e.target.value },
              }))
            }
            placeholder={t.ctaPlaceholder}
            className="w-full"
          />
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleCopySubmit}
          className="bg-orange-400 hover:bg-orange-500 text-white px-8"
        >
          {t.next}
        </Button>
      </div>
    </div>
  );

  const renderImageTypeSelect = () => (
    <div className="space-y-6">
      {renderYumiMessage(t.imageTypeQuestion)}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <div
          onClick={() => handleImageTypeSelect(true)}
          className="p-6 rounded-xl border-2 border-gray-200 hover:border-orange-400 cursor-pointer transition-all text-center"
        >
          <div className="text-4xl mb-3">🛍️</div>
          <h4 className="font-semibold text-gray-900 mb-2">{t.yesIncludeProduct}</h4>
          <p className="text-sm text-gray-500">{t.productDescription}</p>
        </div>

        <div
          onClick={() => handleImageTypeSelect(false)}
          className="p-6 rounded-xl border-2 border-gray-200 hover:border-orange-400 cursor-pointer transition-all text-center"
        >
          <div className="text-4xl mb-3">🌅</div>
          <h4 className="font-semibold text-gray-900 mb-2">{t.noWithoutProduct}</h4>
          <p className="text-sm text-gray-500">{t.lifestyleDescription}</p>
        </div>
      </div>
    </div>
  );

  const renderPdpInput = () => (
    <div className="space-y-6">
      {renderYumiMessage(t.pdpQuestion)}

      <div className="max-w-lg mx-auto space-y-4">
        <Input
          value={wizardState.pdpUrl}
          onChange={(e) =>
            setWizardState((prev) => ({ ...prev, pdpUrl: e.target.value }))
          }
          placeholder={t.pdpPlaceholder}
          className="w-full"
        />

        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => handleImageTypeSelect(false)}>
            {t.proceedWithoutProduct}
          </Button>
          <Button
            onClick={handlePdpSubmit}
            disabled={!wizardState.pdpUrl.trim() || isLoading}
            className="bg-orange-400 hover:bg-orange-500 text-white px-8"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t.getImage}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPdpPreview = () => (
    <div className="space-y-6">
      {renderYumiMessage(t.pdpConfirmQuestion)}

      <div className="flex justify-center">
        <div className="w-64 h-64 rounded-xl overflow-hidden shadow-lg bg-gray-100">
          {wizardState.productImageUrl ? (
            <img src={wizardState.productImageUrl} alt="Product" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">Loading...</div>
          )}
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={() => setPhase("pdp-input")}>{t.selectOther}</Button>
        <Button onClick={handlePdpConfirm} className="bg-orange-400 hover:bg-orange-500 text-white px-8">{t.useThis}</Button>
      </div>
    </div>
  );

  const renderLifestyleInput = () => (
    <div className="space-y-6">
      {renderYumiMessage(wizardState.includeProduct ? t.lifestyleQuestionWithProduct : t.lifestyleQuestionWithoutProduct)}

      <div className="max-w-lg mx-auto space-y-4">
        <Textarea
          value={wizardState.lifestyleDescription}
          onChange={(e) =>
            setWizardState((prev) => ({
              ...prev,
              lifestyleDescription: e.target.value,
            }))
          }
          placeholder={t.lifestylePlaceholder}
          rows={4}
          className="w-full"
        />

        <div className="flex flex-wrap gap-2">
          {t.lifestyleSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() =>
                setWizardState((prev) => ({
                  ...prev,
                  lifestyleDescription: suggestion,
                }))
              }
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleLifestyleGenerate}
          disabled={!wizardState.lifestyleDescription.trim() || isLoading}
          className="bg-orange-400 hover:bg-orange-500 text-white px-8"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {t.generateImage}
        </Button>
      </div>
    </div>
  );

  const renderLifestyleGenerating = () => (
    <div className="space-y-6">
      {renderYumiMessage(t.generatingLifestyle)}
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
      </div>
    </div>
  );

  const renderLifestylePreview = () => (
    <div className="space-y-6">
      {renderYumiMessage(t.lifestylePreviewQuestion)}
      <div className="flex justify-center">
        <div className="max-w-md rounded-xl overflow-hidden shadow-lg bg-gray-100">
          {wizardState.lifestyleImageUrl ? (
            <img src={wizardState.lifestyleImageUrl} alt="Lifestyle" className="w-full h-auto" />
          ) : (
            <div className="w-full h-64 flex items-center justify-center text-gray-400">Loading...</div>
          )}
        </div>
      </div>
      <div className="flex justify-center gap-4">
        <Button variant="outline" onClick={handleRegenerateLifestyle}>
          <RefreshCw className="w-4 h-4 mr-2" />{t.regenerate}
        </Button>
        <Button onClick={handleLifestyleConfirm} className="bg-orange-400 hover:bg-orange-500 text-white px-8">{t.useThis}</Button>
      </div>
    </div>
  );

  const renderFinalGenerating = () => (
    <div className="space-y-6">
      {renderYumiMessage(t.generatingFinal)}
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
        <p className="text-gray-500">{t.combiningAssets}</p>
      </div>
    </div>
  );

  const renderFinalPreview = () => (
    <div className="space-y-6">
      {renderYumiMessage(t.finalComplete)}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3">📝 {t.inputCopy}</h4>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">Headline:</span> <span className="text-gray-900">{wizardState.copyInputs.headline}</span></div>
            <div><span className="text-gray-500">Subcopy:</span> <span className="text-gray-900">{wizardState.copyInputs.subcopy}</span></div>
            <div><span className="text-gray-500">CTA:</span> <span className="text-gray-900">{wizardState.copyInputs.cta}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3">🖼️ Lifestyle Image</h4>
          {wizardState.lifestyleImageUrl && <img src={wizardState.lifestyleImageUrl} alt="Lifestyle" className="w-full h-40 object-cover rounded-lg" />}
        </div>
      </div>
      <div className="flex justify-center gap-2">
        {wizardState.selectedChannels.map((channelId) => {
          const channel = CHANNELS.find((c) => c.id === channelId);
          return <span key={channelId} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">{channel?.name}</span>;
        })}
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <Button onClick={() => handleExport("png")} disabled={isExporting} variant="outline" className="px-6">
          {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}{t.downloadPng}
        </Button>
        <Button onClick={() => handleExport("svg")} disabled={isExporting} variant="outline" className="px-6">
          <FileText className="w-4 h-4 mr-2" />{t.downloadSvg}
        </Button>
        <Button onClick={openInFigma} variant="outline" className="px-6">
          <ExternalLink className="w-4 h-4 mr-2" />{t.openInFigma}
        </Button>
      </div>
      <div className="flex justify-center gap-4 pt-4">
        <Button variant="ghost" onClick={handleStartOver}>{t.startOver}</Button>
        <Button onClick={() => navigate("/")} className="bg-orange-400 hover:bg-orange-500 text-white px-8">{t.goHome}</Button>
      </div>
    </div>
  );

  const renderError = () => {
    const [retryDisabled, setRetryDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const handleRetryWithDebounce = () => {
      if (retryDisabled) return;
      
      setRetryDisabled(true);
      setCountdown(30);
      
      // Start countdown
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setRetryDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      handleRetry();
    };

    return (
      <div className="space-y-6">
        {renderYumiMessage(loadError === "RATE_LIMIT" ? t.rateLimitError : t.genericError)}
        <div className="flex flex-col items-center gap-4">
          {loadError === "RATE_LIMIT" && (
            <p className="text-sm text-gray-500 text-center">
              Figma API 호출 제한에 도달했습니다.<br/>
              캐시된 데이터가 없어 잠시 후 다시 시도해주세요.
            </p>
          )}
          <Button 
            onClick={handleRetryWithDebounce} 
            disabled={retryDisabled}
            className="bg-orange-400 hover:bg-orange-500 text-white px-8 disabled:opacity-50"
          >
            {retryDisabled ? `${countdown}초 후 재시도 가능` : t.retry}
          </Button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (phase) {
      case "loading":
        return (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
            <p className="mt-4 text-gray-500">{t.preparing}</p>
          </div>
        );
      case "layout-select":
        return renderLayoutSelect();
      case "layout-confirm":
        return renderLayoutConfirm();
      case "channel-select":
        return renderChannelSelect();
      case "syncing":
        return renderSyncing();
      case "copy-collect":
        return renderCopyCollect();
      case "image-type-select":
        return renderImageTypeSelect();
      case "pdp-input":
        return renderPdpInput();
      case "pdp-preview":
        return renderPdpPreview();
      case "lifestyle-input":
        return renderLifestyleInput();
      case "lifestyle-generating":
        return renderLifestyleGenerating();
      case "lifestyle-preview":
        return renderLifestylePreview();
      case "final-generating":
        return renderFinalGenerating();
      case "final-preview":
      case "completed":
        return renderFinalPreview();
      case "error":
        return renderError();
      default:
        return null;
    }
  };

  // ==================== Main Render ====================

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url('/lovable-uploads/bc537bc9-b912-4359-a294-eb543db318e3.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Back to Home button */}
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-white hover:bg-white/10 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </div>

      {/* Main container - Compact layout */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden relative">
          {/* Header */}
          <div className="bg-white p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <img src="/lovable-uploads/1d0546ae-2d59-40cf-a231-60343eecc72a.png" alt="Yumi Profile" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Yumi</h2>
                  <p className="text-sm text-gray-600">Promotional Content Designer</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Language Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>{LANGUAGE_OPTIONS.find(l => l.code === currentLanguage)?.flag}</span>
                      <span className="hidden sm:inline">{LANGUAGE_OPTIONS.find(l => l.code === currentLanguage)?.name}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <DropdownMenuItem key={lang.code} onClick={() => setCurrentLanguage(lang.code)} className="flex items-center gap-2">
                        <span>{lang.flag}</span><span>{lang.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Step Indicator */}
                {phase !== "loading" && phase !== "error" && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{t.step} {getStepNumber()} / {totalSteps}</span>
                    <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-400 transition-all" style={{ width: `${(getStepNumber() / totalSteps) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Area - Scrollable with history */}
          <div className="max-h-[500px] min-h-[400px] p-6 bg-gray-50 overflow-y-auto scroll-smooth">
            {renderChatHistory()}
            <div className="animate-fade-in">
              {renderContent()}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
