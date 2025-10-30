const form = document.getElementById('fileForm');
const butterflyEdge = document.getElementById('butterflyEdge');
const earshotContainer = document.getElementById('earshotContainer');
const addEarshotBtn = document.getElementById('addEarshotBtn');
const fabricInput = document.getElementById('FabricName');

const frontGallery = document.getElementById('frontGallery');
const sideGallery = document.getElementById('sideGallery');
const frontInput = document.getElementById('frontPic');
const sideInput = document.getElementById('sidePic');

function createFileCard(file, filenamePreview, removeCallback) {
  const card = document.createElement('div');
  card.className = 'file-card';
  const img = document.createElement('img');
  img.className = 'thumbnail';
  img.src = URL.createObjectURL(file);
  img.onload = () => URL.revokeObjectURL(img.src);

  const caption = document.createElement('div');
  caption.className = 'preview';
  caption.textContent = filenamePreview;

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = 'Remove';
  removeBtn.className = 'removeBtn';
  removeBtn.addEventListener('click', () => {
    removeCallback();
    card.remove();
  });

  card.appendChild(img);
  card.appendChild(caption);
  card.appendChild(removeBtn);
  return card;
}

function setupGallery(input, gallery, suffix) {
  let fileData = null;

  function updateGallery(file) {
    gallery.innerHTML = '';
    if (!file) {
      gallery.textContent = `Drag & drop ${suffix} image here or click to select`;
      return;
    }
    const fabricNameVal = fabricInput.value.trim().replace(/\s+/g,'');
    const flange = butterflyEdge.checked ? 'Flange' : '';
    const previewName = fabricNameVal ? `${fabricNameVal}${suffix}${flange}` : file.name;
    gallery.appendChild(createFileCard(file, previewName, () => fileData = null));
    fileData = file;
  }

  gallery.addEventListener('click', () => input.click());
  ['dragover','dragenter'].forEach(evt => gallery.addEventListener(evt, e => { e.preventDefault(); gallery.classList.add('dragover'); }));
  ['dragleave','drop'].forEach(evt => gallery.addEventListener(evt, e => { e.preventDefault(); gallery.classList.remove('dragover'); }));
  gallery.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) updateGallery(file);
  });

  input.addEventListener('change', () => {
    if (input.files[0]) updateGallery(input.files[0]);
  });

  fabricInput.addEventListener('input', () => { if (fileData) updateGallery(fileData); });
  butterflyEdge.addEventListener('change', () => { if (fileData) updateGallery(fileData); });

  return () => fileData;
}

// Setup Front and Side galleries
const getFrontFile = setupGallery(frontInput, frontGallery, 'Front');
const getSideFile = setupGallery(sideInput, sideGallery, 'Side');

// Earshot entry
function addEarshotEntry(file=null) {
  const div = document.createElement('div');
  div.className = 'earshot-entry';

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = 'Remove';
  removeBtn.className = 'removeBtn';
  removeBtn.addEventListener('click', () => div.remove());

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.required = true;
  fileInput.className = 'earPic';

  // Wrap reverse input for show/hide
  const reverseContainer = document.createElement('div');
  const reverseInput = document.createElement('input');
  reverseInput.type = 'text';
  reverseInput.placeholder = 'Reverse Colorway (optional)';
  reverseInput.className = 'reverseColorway';
  reverseContainer.appendChild(reverseInput);
  reverseContainer.style.display = butterflyEdge.checked ? 'block' : 'none';

  butterflyEdge.addEventListener('change', () => {
    reverseContainer.style.display = butterflyEdge.checked ? 'block' : 'none';
    if (!butterflyEdge.checked) reverseInput.value = '';
    updatePreview();
  });

  const previewDiv = document.createElement('div');
  previewDiv.className = 'preview';

  const thumb = document.createElement('img');
  thumb.className = 'thumbnail';
  thumb.style.display = 'none';

  const updatePreview = () => {
    const fabricNameVal = fabricInput.value.trim().replace(/\s+/g,'');
    const flange = butterflyEdge.checked ? 'Flange' : '';
    const reverse = reverseInput.value.trim().replace(/\s+/g,'');
    let name = fabricNameVal ? fabricNameVal + 'Top' + flange : '';
    if (butterflyEdge.checked && reverse) name += reverse;
    previewDiv.textContent = name ? `Preview: ${name}` : '';
  };

  function setFile(f) {
    const dt = new DataTransfer();
    dt.items.add(f);
    fileInput.files = dt.files;
    thumb.src = URL.createObjectURL(f);
    thumb.style.display = 'block';
    updatePreview();
  }
  if (file) setFile(file);

  // Drag & Drop multi Earshot
  div.addEventListener('dragover', e => { e.preventDefault(); div.style.borderColor = '#66f'; });
  div.addEventListener('dragleave', e => { e.preventDefault(); div.style.borderColor = '#ccc'; });
  div.addEventListener('drop', e => {
    e.preventDefault();
    div.style.borderColor = '#ccc';
    Array.from(e.dataTransfer.files).forEach(f => {
      if (f.type.startsWith('image/')) addEarshotEntry(f);
    });
    div.remove();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) {
      thumb.src = URL.createObjectURL(fileInput.files[0]);
      thumb.style.display = 'block';
    } else thumb.style.display = 'none';
    updatePreview();
  });

  fabricInput.addEventListener('input', updatePreview);
  reverseInput.addEventListener('input', updatePreview);

  div.appendChild(removeBtn);
  div.appendChild(fileInput);
  div.appendChild(reverseContainer);
  div.appendChild(previewDiv);
  div.appendChild(thumb);

  earshotContainer.appendChild(div);
}

// Initial Earshot entry
addEarshotEntry();
addEarshotBtn.addEventListener('click', addEarshotEntry);

// Clear All
document.getElementById('clearBtn').addEventListener('click', () => {
  form.reset();
  frontGallery.innerHTML = `Drag & drop Front image here or click to select`;
  sideGallery.innerHTML = `Drag & drop Side image here or click to select`;
  earshotContainer.innerHTML = '';
  addEarshotEntry();
});

// Submit
form.addEventListener('submit', async e => {
  e.preventDefault();
  const fabricName = fabricInput.value.trim().replace(/\s+/g,'');
  const isButterfly = butterflyEdge.checked;
  const flangeSuffix = isButterfly ? 'Flange' : '';

  const frontPic = getFrontFile();
  const sidePic = getSideFile();
  if (!fabricName || !frontPic) { alert("Fabric Name and Front image required!"); return; }

  const zip = new JSZip();
  zip.file(`${fabricName}Front${flangeSuffix}.${frontPic.name.split('.').pop()}`, frontPic);
  if (sidePic) zip.file(`${fabricName}Side${flangeSuffix}.${sidePic.name.split('.').pop()}`, sidePic);

  document.querySelectorAll('.earshot-entry').forEach(entry => {
    const file = entry.querySelector('.earPic').files[0];
    const reverse = entry.querySelector('.reverseColorway').value.trim().replace(/\s+/g,'');
    if (!file) return;
    let name = `${fabricName}Top${flangeSuffix}`;
    if (isButterfly && reverse) name += reverse;
    zip.file(`${name}.${file.name.split('.').pop()}`, file);
  });

  const content = await zip.generateAsync({ type: "blob" });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${fabricName}_Files.zip`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 100);
});
