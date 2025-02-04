import os
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import json
from flask import Flask, jsonify, send_from_directory
import warnings

# Increase the limit for image pixels
Image.MAX_IMAGE_PIXELS = None

# Suppress the DecompressionBombWarning
warnings.simplefilter('ignore', Image.DecompressionBombWarning)

app = Flask(__name__)

def process_pdfs_from_directory(source_dir, dest_dir):
    if not os.path.exists(dest_dir):
        os.makedirs(dest_dir)

    for filename in os.listdir(source_dir):
        if filename.endswith(".pdf"):
            input_file = os.path.join(source_dir, filename)
            output_file = os.path.join(dest_dir, filename)

            try:
                pdf_document = fitz.open(input_file)
                output_pdf = fitz.open()

                for page_num in range(len(pdf_document)):
                    page = pdf_document.load_page(page_num)
                    pix = page.get_pixmap(dpi=300)
                    img = Image.open(io.BytesIO(pix.tobytes()))

                    custom_config = r'--oem 3 --psm 6'
                    ocr_result = pytesseract.image_to_pdf_or_hocr(img, extension='pdf', config=custom_config)

                    ocr_page = fitz.open("pdf", ocr_result)
                    output_pdf.insert_pdf(ocr_page)

                output_pdf.save(output_file)
                output_pdf.close()
                pdf_document.close()

            except Exception as e:
                print(f"Error processing file {filename}: {e}")

def map_json_objects(questions_file, results_file):
    with open(questions_file, 'r') as qf, open(results_file, 'r') as rf:
        questions = json.load(qf)
        results = json.load(rf)

    mapped_kpis = []
    for kpi_id, result in results.items():
        if kpi_id in questions["KPIs"]:
            source = result['source']
            filename, page_info = source.split('|')
            filename = filename.strip()
            page = page_info.split(' ')[2]  # Extract the page number
            mapped_kpis.append({
                'kpi_id': kpi_id,
                'name': questions["KPIs"][kpi_id],
                'source': f"{filename}:{page}"
            })

    return mapped_kpis

@app.route('/api/kpis', methods=['GET'])
def get_kpis():
    questions_file = r"C:\Sebastian\Projects\Morgen Stanley\readPDF\readPDFApp\kpis\questions.json"
    results_file = r"C:\Sebastian\Projects\Morgen Stanley\readPDF\readPDFApp\kpis\results.json"
    mapped_kpis = map_json_objects(questions_file, results_file)
    return jsonify(mapped_kpis)

@app.route('/api/pdfs/<filename>', methods=['GET'])
def get_pdf(filename):
    return send_from_directory(r'C:\Sebastian\Projects\Morgen Stanley\readPDF\readPDFApp\processed_pdfs', filename)

@app.route('/pdf.worker.js', methods=['GET'])
def get_pdf_worker():
    return send_from_directory(app.static_folder, 'pdf.worker.js')

if __name__ == '__main__':
    source_dir = r"C:\Sebastian\Projects\Morgen Stanley\readPDF\readPDFApp\SourcePDF"
    dest_dir = r"C:\Sebastian\Projects\Morgen Stanley\readPDF\readPDFApp\processed_pdfs"
    process_pdfs_from_directory(source_dir, dest_dir)
    app.run(debug=True, port=5001)