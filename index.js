import { classifyImage } from './aimodel.js'; // Your AI model function

const form = document.getElementById('fileForm');
const butterflyEdge = document.getElementById('butterflyEdge');
const fabricInput = document.getElementById('FabricName');
const frontGallery = document.getElementById('frontGallery');
const sideGallery = document.getElementById('sideGallery');
const smartGallery = document.getElementById('smartGallery');
const smartInput = document.getElementById('smartInput');
const earshotContainer = document.getElementById('earshotContainer');

const earshotEntries = [];

// --- File card creation ---
function createFileCard(file, filenamePreview) {
  const card = document.createElement('div');
  card.className = 'file-card';
  const img = document.createElement('img');
  img.className = 'thumbnail';
  img.src = URL.createObjectURL(file);
  img.onload = () => URL.revokeObjectURL(img.src);

  const caption = document.createElement('div');
  caption.className = 'preview';
  caption.textContent = filenamePreview;

  card.append(img, caption);
  return card;
}

// --- Gallery handler ---
function createGalleryHandler(gallery, suffix) {
  let fileData = null;
  const previewDiv = document.createElement('div');
  previewDiv.className = 'preview';
  gallery.innerHTML = '';
  gallery.appendChild(previewDiv);

  const updateGallery = file => {
    gallery.innerHTML = '';
    gallery.appendChild(previewDiv);

    if (!file) {
      previewDiv.textContent = `No ${suffix} image`;
      return;
    }

    const fabricNameVal = fabricInput.value.trim().replace(/\s+/g, '');
    const flange = butterflyEdge.checked ? 'Flange' : '';
    const previewName = fabricNameVal ? `${fabricNameVal}${suffix}${flange}` : file.name;

    gallery.appendChild(createFileCard(file, previewName));
    previewDiv.textContent = `Preview: ${previewName}`;
    fileData = file;
  };

  fabricInput.addEventListener('input', () => { if(fileData) updateGallery(fileData); });
  butterflyEdge.addEventListener('change', () => { if(fileData) updateGallery(fileData); });

  return { set: updateGallery, get: () => fileData };
}

const frontHandler = createGalleryHandler(frontGallery, 'Front');
const sideHandler = createGalleryHandler(sideGallery, 'Side');

// --- Earshot entry ---
function addEarshotEntry(file = null) {
  const div = document.createElement('div');
  div.className = 'earshot-entry';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = 'Remove';
  removeBtn.className = 'removeBtn';
  removeBtn.addEventListener('click', () => {
    div.remove();
    const index = earshotEntries.indexOf(entry);
    if (index > -1) earshotEntries.splice(index, 1);
  });

  // --- Reverse Colorway input ---
  const reverseInput = document.createElement('input');
  reverseInput.type = 'text';
  reverseInput.placeholder = 'Reverse Colorway (optional)';
  reverseInput.className = 'reverseColorway';
  reverseInput.style.display = butterflyEdge.checked ? 'block' : 'none'; // hide initially if not checked

  // Toggle display when checkbox changes
  butterflyEdge.addEventListener('change', () => {
    reverseInput.style.display = butterflyEdge.checked ? 'block' : 'none';
    if (!butterflyEdge.checked) reverseInput.value = '';
    updatePreview();
  });

  const previewDiv = document.createElement('div');
  previewDiv.className = 'preview';

  const thumb = document.createElement('img');
  thumb.className = 'thumbnail';
  thumb.style.display = 'none';

  let storedFile = file || null;

  const updatePreview = () => {
    const fabricNameVal = fabricInput.value.trim().replace(/\s+/g,'');
    const flange = butterflyEdge.checked ? 'Flange' : '';
    const reverse = reverseInput.value.trim().replace(/\s+/g,'');
    let name = fabricNameVal ? fabricNameVal + 'Top' + flange : '';
    if (butterflyEdge.checked && reverse) name += reverse;
    previewDiv.textContent = name ? `Preview: ${name}` : '';
  };

  if (file) {
    thumb.src = URL.createObjectURL(file);
    thumb.style.display = 'block';
    updatePreview();
  }

  const entry = {
    div,
    thumb,
    reverseInput,
    getFile: () => storedFile,
    setFile: f => {
      storedFile = f;
      thumb.src = URL.createObjectURL(f);
      thumb.style.display = 'block';
      updatePreview();
    }
  };

  // Live preview updates
  fabricInput.addEventListener('input', updatePreview);
  reverseInput.addEventListener('input', updatePreview);

  div.append(removeBtn, reverseInput, previewDiv, thumb);
  earshotContainer.appendChild(div);
  earshotEntries.push(entry);

  return entry;
}

// Initial empty Earshot entry
addEarshotEntry();

// --- Smart Drop Zone ---
smartGallery.addEventListener('click', () => smartInput.click());
smartGallery.addEventListener('dragover', e => { e.preventDefault(); smartGallery.classList.add('dragover'); });
smartGallery.addEventListener('dragleave', e => { e.preventDefault(); smartGallery.classList.remove('dragover'); });
smartGallery.addEventListener('drop', async e => {
  e.preventDefault();
  smartGallery.classList.remove('dragover');
  handleFiles(Array.from(e.dataTransfer.files));
});

smartInput.addEventListener('change', () => handleFiles(Array.from(smartInput.files)));

async function handleFiles(files) {
  smartGallery.textContent = 'Processing images...';
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;

    const { angle } = await classifyImage('pillows', file);

    if (angle === 'Front') frontHandler.set(file);
    else if (angle === 'Side') sideHandler.set(file);
    else {
      const entry = addEarshotEntry();
      entry.setFile(file);
    }
  }
  smartGallery.textContent = 'Drop all images here — AI will auto-sort Front/Side/Top';
}

// --- Clear all ---
document.getElementById('clearBtn').addEventListener('click', () => {
  form.reset();
  frontGallery.innerHTML = 'No Front image';
  sideGallery.innerHTML = 'No Side image';
  earshotContainer.innerHTML = '';
  earshotEntries.length = 0;
  addEarshotEntry();
});

// --- Submit (ZIP) ---
form.addEventListener('submit', async e => {
  e.preventDefault();
  const fabricName = fabricInput.value.trim().replace(/\s+/g,'');
  const flangeSuffix = butterflyEdge.checked ? 'Flange' : '';
  const frontPic = frontHandler.get();
  const sidePic = sideHandler.get();

  if (!fabricName || !frontPic) { alert("Fabric Name and Front image required!"); return; }

  const zip = new JSZip();
  zip.file(`${fabricName}Front${flangeSuffix}.${frontPic.name.split('.').pop()}`, frontPic);
  if (sidePic) zip.file(`${fabricName}Side${flangeSuffix}.${sidePic.name.split('.').pop()}`, sidePic);

  earshotEntries.forEach(entry => {
    const file = entry.getFile();
    if (!file) return;
    let name = `${fabricName}Top${flangeSuffix}`;
    const reverse = entry.reverseInput.value.trim().replace(/\s+/g,'');
    if (reverse) name += reverse;
    zip.file(`${name}.${file.name.split('.').pop()}`, file);
  });

  const content = await zip.generateAsync({ type: "blob" });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${fabricName}_Files.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 100);
});
