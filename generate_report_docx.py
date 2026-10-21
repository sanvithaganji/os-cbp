import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from pathlib import Path

def set_cell_background(cell, hex_color):
    """Set the background color of a table cell."""
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    """Set inner padding for a table cell (in dxa: 20 dxa = 1 pt)."""
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def set_table_borders(table, color="D3D3D3", sz="4", val="single"):
    """Apply clean subtle borders to a table."""
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="none"/>'
        f'<w:right w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def build_report():
    doc = Document()

    # Set page margins to 1 inch
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.different_first_page_header_footer = True
        
        # Header / Footer
        header = section.header
        hp = header.paragraphs[0]
        hp.text = "MiniOS — File Storage & Processing Lab | Course-Based Project Report"
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hp.style.font.name = "Calibri"
        hp.style.font.size = Pt(8.5)
        hp.style.font.color.rgb = RGBColor(128, 128, 128)

        footer = section.footer
        fp = footer.paragraphs[0]
        fp.text = "Department of CSE — VNR Vignana Jyothi Institute of Engineering and Technology"
        fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        fp.style.font.name = "Calibri"
        fp.style.font.size = Pt(8.5)
        fp.style.font.color.rgb = RGBColor(128, 128, 128)

    # Styles setup
    style_normal = doc.styles['Normal']
    style_normal.font.name = 'Calibri'
    style_normal.font.size = Pt(11)
    style_normal.font.color.rgb = RGBColor(33, 37, 41)
    style_normal.paragraph_format.line_spacing = 1.15
    style_normal.paragraph_format.space_after = Pt(6)

    # =========================================================================
    # 1. COVER PAGE / TITLE PAGE
    # =========================================================================
    title_p1 = doc.add_paragraph()
    title_p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_p1.paragraph_format.space_after = Pt(2)
    run_inst = title_p1.add_run("VNR VIGNANA JYOTHI INSTITUTE OF ENGINEERING AND TECHNOLOGY")
    run_inst.font.size = Pt(14)
    run_inst.font.bold = True
    run_inst.font.color.rgb = RGBColor(16, 44, 87)

    title_p2 = doc.add_paragraph()
    title_p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_p2.paragraph_format.space_after = Pt(4)
    run_aff = title_p2.add_run("(An Autonomous Institute, Accredited by NAAC with 'A++' Grade, Affiliated to JNTUH)\nBachupally, Nizampet (S.O), Hyderabad – 500 090, Telangana, India")
    run_aff.font.size = Pt(9.5)
    run_aff.font.color.rgb = RGBColor(100, 100, 100)

    doc.add_paragraph().paragraph_format.space_after = Pt(24)

    # Project Title
    p_proj = doc.add_paragraph()
    p_proj.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_proj.paragraph_format.space_after = Pt(8)
    run_proj_title = p_proj.add_run("MINIOS — FILE STORAGE & PROCESSING LAB")
    run_proj_title.font.size = Pt(20)
    run_proj_title.font.bold = True
    run_proj_title.font.color.rgb = RGBColor(13, 71, 161)

    p_proj_sub = doc.add_paragraph()
    p_proj_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_proj_sub.paragraph_format.space_after = Pt(28)
    run_sub = p_proj_sub.add_run("A Full-Stack Operating Systems Engineering Platform with Integrated File Management,\nProcessing Suite, and Deterministic Algorithm Simulations")
    run_sub.font.size = Pt(11.5)
    run_sub.font.italic = True
    run_sub.font.color.rgb = RGBColor(80, 80, 80)

    # Submission statement
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_sub.paragraph_format.space_after = Pt(24)
    run_stmt = p_sub.add_run("A COURSE-BASED PROJECT REPORT\nSubmitted in partial fulfillment of the academic requirements\nfor the award of the degree of\n\nBACHELOR OF TECHNOLOGY\nin\nCOMPUTER SCIENCE AND ENGINEERING")
    run_stmt.font.size = Pt(11)
    run_stmt.font.bold = True
    run_stmt.font.color.rgb = RGBColor(40, 40, 40)

    doc.add_paragraph().paragraph_format.space_after = Pt(20)

    # Submitted by & Under Guidance of Table
    t_auth = doc.add_table(rows=1, cols=2)
    t_auth.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_auth.autofit = True
    cell_left = t_auth.cell(0, 0)
    cell_right = t_auth.cell(0, 1)
    cell_left.width = Inches(3.2)
    cell_right.width = Inches(3.2)

    p_left = cell_left.paragraphs[0]
    p_left.paragraph_format.space_after = Pt(2)
    r_l1 = p_left.add_run("Submitted by:\n")
    r_l1.font.bold = True
    r_l2 = p_left.add_run("SANVITHA GANJI\nRoll No: 24071A66XX\nB.Tech (CSE), II Year")
    r_l2.font.size = Pt(10.5)

    p_right = cell_right.paragraphs[0]
    p_right.paragraph_format.space_after = Pt(2)
    r_r1 = p_right.add_run("Under the Guidance of:\n")
    r_r1.font.bold = True
    r_r2 = p_right.add_run("Faculty Coordinator / Assistant Professor\nDepartment of Computer Science and Engineering\nVNR Vignana Jyothi Institute of Engg. & Tech.\nHyderabad – 500 090")
    r_r2.font.size = Pt(10.5)

    doc.add_paragraph().paragraph_format.space_after = Pt(28)

    p_acad = doc.add_paragraph()
    p_acad.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_acad = p_acad.add_run("DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING\nVNR VIGNANA JYOTHI INSTITUTE OF ENGINEERING AND TECHNOLOGY\nACADEMIC YEAR: 2025 – 2026")
    r_acad.font.size = Pt(10)
    r_acad.font.bold = True
    r_acad.font.color.rgb = RGBColor(16, 44, 87)

    doc.add_page_break()

    # =========================================================================
    # 2. CERTIFICATE
    # =========================================================================
    p_cert_head = doc.add_paragraph()
    p_cert_head.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cert_head.paragraph_format.space_after = Pt(4)
    r = p_cert_head.add_run("VNR VIGNANA JYOTHI INSTITUTE OF ENGINEERING AND TECHNOLOGY")
    r.font.size = Pt(13)
    r.font.bold = True
    r.font.color.rgb = RGBColor(16, 44, 87)

    p_cert_sub = doc.add_paragraph()
    p_cert_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cert_sub.paragraph_format.space_after = Pt(16)
    r = p_cert_sub.add_run("Bachupally (V), Nizampet (S.O), Hyderabad – 500 090, Telangana, India\nDEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING")
    r.font.size = Pt(9.5)
    r.font.color.rgb = RGBColor(90, 90, 90)

    p_cert_title = doc.add_paragraph()
    p_cert_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cert_title.paragraph_format.space_after = Pt(18)
    r = p_cert_title.add_run("CERTIFICATE")
    r.font.size = Pt(16)
    r.font.bold = True
    r.font.underline = True
    r.font.color.rgb = RGBColor(13, 71, 161)

    p_cert_body = doc.add_paragraph()
    p_cert_body.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_cert_body.paragraph_format.line_spacing = 1.3
    p_cert_body.paragraph_format.space_after = Pt(16)
    p_cert_body.add_run(
        "This is to certify that the course project work entitled "
    )
    r_proj = p_cert_body.add_run("“MINIOS — FILE STORAGE & PROCESSING LAB: A COMPREHENSIVE OPERATING SYSTEMS LABORATORY APPLICATION”")
    r_proj.font.bold = True
    p_cert_body.add_run(
        " is a bonafide work carried out by "
    )
    r_name = p_cert_body.add_run("SANVITHA GANJI (Roll No: 24071A66XX)")
    r_name.font.bold = True
    p_cert_body.add_run(
        ", student of the Department of Computer Science and Engineering, VNR Vignana Jyothi Institute of Engineering and Technology, Hyderabad, "
        "in partial fulfillment of the requirements for the award of the degree of Bachelor of Technology in Computer Science and Engineering during the academic year 2025–2026.\n\n"
        "The project has been executed and evaluated in accordance with the prescribed standards of the Operating Systems Course Curriculum. This work has not been submitted to any other university or institute for the award of any degree or diploma."
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(40)

    # Signatures
    t_sig = doc.add_table(rows=1, cols=2)
    t_sig.alignment = WD_TABLE_ALIGNMENT.CENTER
    t_sig.autofit = True
    s_left = t_sig.cell(0, 0)
    s_right = t_sig.cell(0, 1)
    s_left.width = Inches(3.2)
    s_right.width = Inches(3.2)

    ps_left = s_left.paragraphs[0]
    ps_left.paragraph_format.space_after = Pt(2)
    ps_left.add_run("___________________________\nProject Guide / Internal Examiner\nDepartment of CSE\nVNR VJIET, Hyderabad")
    ps_left.runs[0].font.size = Pt(10)
    ps_left.runs[0].font.bold = True

    ps_right = s_right.paragraphs[0]
    ps_right.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    ps_right.paragraph_format.space_after = Pt(2)
    ps_right.add_run("___________________________\nHead of the Department (HOD)\nDepartment of CSE\nVNR VJIET, Hyderabad")
    ps_right.runs[0].font.size = Pt(10)
    ps_right.runs[0].font.bold = True

    doc.add_page_break()

    # =========================================================================
    # 3. DECLARATION
    # =========================================================================
    p_dec_title = doc.add_paragraph()
    p_dec_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_dec_title.paragraph_format.space_after = Pt(18)
    r = p_dec_title.add_run("DECLARATION")
    r.font.size = Pt(16)
    r.font.bold = True
    r.font.underline = True
    r.font.color.rgb = RGBColor(13, 71, 161)

    p_dec_body = doc.add_paragraph()
    p_dec_body.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_dec_body.paragraph_format.line_spacing = 1.3
    p_dec_body.paragraph_format.space_after = Pt(16)
    p_dec_body.add_run(
        "I hereby declare that the course-based project report titled "
    )
    r_dt = p_dec_body.add_run("“MINIOS — FILE STORAGE & PROCESSING LAB”")
    r_dt.font.bold = True
    p_dec_body.add_run(
        " submitted to Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering and Technology (VNRVJIET), Hyderabad, "
        "in partial fulfillment of the requirements for the award of Bachelor of Technology in Computer Science and Engineering, is an original record "
        "of the work carried out by me under the guidance and supervision of the faculty of the Department of Computer Science and Engineering.\n\n"
        "I further declare that this report represents my own genuine efforts, software engineering design, algorithm implementations, and empirical findings. "
        "The software, algorithm code, automated test suites, and simulation metrics contained herein have not been duplicated from any external source or submitted to any other university or educational institution for the award of any degree or diploma."
    )

    doc.add_paragraph().paragraph_format.space_after = Pt(40)

    p_dec_sig = doc.add_paragraph()
    p_dec_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_dec_sig.paragraph_format.space_after = Pt(4)
    r_sig = p_dec_sig.add_run("Signature of the Candidate:\n\n\n___________________________\nSANVITHA GANJI\nRoll No: 24071A66XX\nDepartment of CSE, VNRVJIET")
    r_sig.font.size = Pt(10.5)
    r_sig.font.bold = True

    p_date = doc.add_paragraph()
    p_date.paragraph_format.space_after = Pt(2)
    p_date.add_run("Place: Hyderabad\nDate: October 2026")
    p_date.runs[0].font.size = Pt(10)
    p_date.runs[0].font.italic = True

    doc.add_page_break()

    # =========================================================================
    # 4. ACKNOWLEDGEMENT
    # =========================================================================
    p_ack_title = doc.add_paragraph()
    p_ack_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_ack_title.paragraph_format.space_after = Pt(18)
    r = p_ack_title.add_run("ACKNOWLEDGEMENT")
    r.font.size = Pt(16)
    r.font.bold = True
    r.font.underline = True
    r.font.color.rgb = RGBColor(13, 71, 161)

    p_ack = doc.add_paragraph()
    p_ack.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_ack.paragraph_format.line_spacing = 1.25
    p_ack.paragraph_format.space_after = Pt(12)
    p_ack.add_run(
        "I express my deep sense of gratitude to our respected Principal and the Management of "
        "VNR Vignana Jyothi Institute of Engineering and Technology for providing excellent academic infrastructure, computational facilities, "
        "and a stimulating environment that facilitated the successful completion of this course-based project.\n\n"
        "I extend my sincere thanks to the Head of the Department of Computer Science and Engineering, for continuous encouragement, "
        "academic leadership, and support throughout the semester.\n\n"
        "I am profoundly indebted to my Project Guide and Faculty Members of the Department of Computer Science and Engineering for their constant guidance, "
        "constructive suggestions, and thorough reviews at every stage of the project. Their valuable insights into operating systems theory, algorithm invariants, "
        "and software architecture were instrumental in bridging low-level concepts with a high-performance web interface.\n\n"
        "Finally, I would like to thank all faculty colleagues, lab technicians, and peers who supported me during the development and testing of this application."
    )

    p_ack_sig = doc.add_paragraph()
    p_ack_sig.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_ack_sig.paragraph_format.space_after = Pt(4)
    r_as = p_ack_sig.add_run("\nSANVITHA GANJI\n(Roll No: 24071A66XX)")
    r_as.font.bold = True

    doc.add_page_break()

    # =========================================================================
    # 5. ABSTRACT
    # =========================================================================
    p_abs_title = doc.add_paragraph()
    p_abs_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_abs_title.paragraph_format.space_after = Pt(18)
    r = p_abs_title.add_run("ABSTRACT")
    r.font.size = Pt(16)
    r.font.bold = True
    r.font.underline = True
    r.font.color.rgb = RGBColor(13, 71, 161)

    p_abs = doc.add_paragraph()
    p_abs.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_abs.paragraph_format.line_spacing = 1.25
    p_abs.paragraph_format.space_after = Pt(12)
    p_abs.add_run(
        "The Operating Systems curriculum forms the core foundation of computer systems engineering, covering essential concepts such as process scheduling, memory partitioning, virtual memory paging, secondary storage allocation, deadlock handling, and disk cylinder arm scheduling. However, students frequently struggle to bridge the conceptual gap between theoretical pseudocode and practical filesystem operations. Traditional laboratory exercises either rely on detached command-line C scripts or superficial visual prototypes with fabricated outputs.\n\n"
        "To resolve this pedagogical challenge, this course project implements "
    )
    r_m = p_abs.add_run("MiniOS — File Storage & Processing Lab")
    r_m.font.bold = True
    p_abs.add_run(
        ", an end-to-end full-stack web application that combines a functional local file storage and processing suite with deterministic, mathematically verified interactive simulations of all 15 algorithms specified in the six-week Operating Systems laboratory syllabus.\n\n"
        "The system consists of two tightly coupled components: (1) A lightweight Mini File System allowing drag-and-drop file uploads, hierarchical directory nesting, safe filesystem persistence on local storage with SQLite metadata indexing, an in-app live text/code editor, and a ten-tool processing workbench (including text analysis, CSV inspection, JSON validation, ZIP compression/decompression, SHA-256 hash generation, duplicate file detection, and line-by-line diff comparison); and (2) An interactive OS Simulation Engine implementing all syllabus modules: Week 1 CPU Scheduling (FCFS, Non-Preemptive SJF, Round Robin with configurable quantum, and Priority Scheduling with Gantt charts and mathematical invariant verification TAT = CT − AT, WT = TAT − BT); Week 2 Memory Allocation (First Fit, Best Fit, and Worst Fit with proportional block maps and internal fragmentation analysis); Week 3 File Allocation (Contiguous, Indexed, and Linked strategies on a visual 64-sector disk grid demonstrating external fragmentation); Week 4 Deadlock Management (Banker’s Algorithm safety checks and dynamic resource request evaluations alongside separate Deadlock Detection using Work/Finish vectors); Week 5 Page Replacement (FIFO, Optimal lookahead, and LRU with complete frame matrices); and Week 6 Disk Scheduling (SCAN, C-SCAN, and LOOK with 2D coordinate seek trajectories).\n\n"
        "The backend is developed in Python using FastAPI, SQLAlchemy, and Pillow, adhering to REST architectural standards and tested via 23 automated Pytest test cases covering mathematical invariants and edge cases. The frontend is built using React 19, TypeScript, Vite, Tailwind CSS, and Lucide Icons, providing a developer-tool desktop dashboard with dark/light themes, step-by-step playback controllers, and an automated laboratory report generator exporting to Markdown and printable formats. MiniOS provides an extensible, locally executable platform that transforms abstract OS concepts into observable, interactive computing experiences."
    )

    doc.add_page_break()

    # =========================================================================
    # 6. TABLE OF CONTENTS
    # =========================================================================
    p_toc_title = doc.add_paragraph()
    p_toc_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_toc_title.paragraph_format.space_after = Pt(18)
    r = p_toc_title.add_run("TABLE OF CONTENTS")
    r.font.size = Pt(16)
    r.font.bold = True
    r.font.underline = True
    r.font.color.rgb = RGBColor(13, 71, 161)

    toc_data = [
        ("1. Introduction", "1"),
        ("   1.1 Background and Motivation", "1"),
        ("   1.2 Problem Statement", "2"),
        ("   1.3 Objectives of the Project", "2"),
        ("   1.4 Scope and Syllabus Alignment", "3"),
        ("2. System Requirements Specification", "4"),
        ("   2.1 Functional Requirements", "4"),
        ("       2.1.1 Mini File Storage & Management", "4"),
        ("       2.1.2 File Processing Tools", "5"),
        ("       2.1.3 OS Algorithm Simulation Modules (Weeks 1 to 6)", "6"),
        ("       2.1.4 Lab Report Generator", "7"),
        ("   2.2 Non-Functional Requirements", "8"),
        ("   2.3 Hardware & Software Specifications", "9"),
        ("3. System Architecture", "10"),
        ("   3.1 Layered Architectural Model", "10"),
        ("   3.2 Client-Server Communication Flow", "11"),
        ("   3.3 Data Storage & Persistence Model", "12"),
        ("4. System Modeling (UML Diagrams)", "13"),
        ("   4.1 Structural Modeling", "13"),
        ("       4.1.1 Class Diagram", "13"),
        ("       4.1.2 Component Diagram", "14"),
        ("       4.1.3 Package Diagram", "15"),
        ("       4.1.4 Deployment Diagram", "16"),
        ("   4.2 Behavioral Modeling", "17"),
        ("       4.2.1 Use Case Diagram", "17"),
        ("       4.2.2 Activity Diagram", "18"),
        ("       4.2.3 Sequence Diagram", "19"),
        ("       4.2.4 State Chart Diagram", "20"),
        ("       4.2.5 Communication Diagram", "21"),
        ("5. Implementation", "22"),
        ("   5.1 Backend REST API & Services", "22"),
        ("   5.2 OS Algorithm Engine (15 Algorithms)", "23"),
        ("       5.2.1 Week 1: CPU Scheduling (FCFS, SJF, RR, Priority)", "24"),
        ("       5.2.2 Week 2: Memory Allocation (First, Best, Worst Fit)", "26"),
        ("       5.2.3 Week 3: File Allocation (Contiguous, Indexed, Linked)", "28"),
        ("       5.2.4 Week 4: Deadlocks (Banker's & Detection)", "30"),
        ("       5.2.5 Week 5: Page Replacement (FIFO, Optimal, LRU)", "32"),
        ("       5.2.6 Week 6: Disk Scheduling (SCAN, C-SCAN, LOOK)", "34"),
        ("   5.3 File Processing Workbench Implementation", "36"),
        ("   5.4 Frontend Interface & Interactive Visualizers", "38"),
        ("6. Test Cases & Verification", "40"),
        ("   6.1 Automated Pytest Testing Suite", "40"),
        ("   6.2 Mathematical Invariants & Verification Results", "41"),
        ("   6.3 Comprehensive Test Execution Table (23 Passing Tests)", "42"),
        ("7. Results & Visualizations", "45"),
        ("   7.1 Mini File Storage & Quota Dashboard", "45"),
        ("   7.2 File Processing Suite Execution", "46"),
        ("   7.3 OS Lab Simulation Outputs & Visual Charts", "47"),
        ("   7.4 Generated Lab Report Documentation", "50"),
        ("8. Conclusion & Future Enhancements", "51"),
        ("   8.1 Summary of Achievements", "51"),
        ("   8.2 Future Scope & Extensions", "52"),
        ("9. References", "53"),
    ]

    t_toc = doc.add_table(rows=len(toc_data) + 1, cols=3)
    t_toc.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_toc, color="E0E0E0", sz="4")

    # Header
    hdr = t_toc.rows[0].cells
    hdr[0].text = "S. No."
    hdr[1].text = "Section Title / Topic"
    hdr[2].text = "Page No."
    set_cell_background(hdr[0], "F0F4F8")
    set_cell_background(hdr[1], "F0F4F8")
    set_cell_background(hdr[2], "F0F4F8")
    for c in hdr:
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.size = Pt(10)

    hdr[0].width = Inches(0.8)
    hdr[1].width = Inches(4.8)
    hdr[2].width = Inches(0.9)

    for i, (sec, pg) in enumerate(toc_data, start=1):
        row = t_toc.rows[i].cells
        row[0].width = Inches(0.8)
        row[1].width = Inches(4.8)
        row[2].width = Inches(0.9)
        
        row[0].text = str(i) if not sec.startswith("   ") else ""
        row[1].text = sec
        row[2].text = pg
        row[2].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.RIGHT

        for cell in row:
            set_cell_margins(cell, top=60, bottom=60, left=100, right=100)
            if cell.paragraphs[0].runs:
                cell.paragraphs[0].runs[0].font.size = Pt(9.5)
                if not sec.startswith("   "):
                    cell.paragraphs[0].runs[0].font.bold = True

    doc.add_page_break()

    # Helper function for adding styled chapters
    def add_chapter_heading(num, title):
        p = doc.add_paragraph(style='Heading 1')
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(f"CHAPTER {num}: {title.upper()}")
        r.font.size = Pt(15)
        r.font.bold = True
        r.font.color.rgb = RGBColor(13, 71, 161)
        return p

    def add_section_heading(title):
        p = doc.add_paragraph(style='Heading 2')
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        r.font.size = Pt(12.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(30, 41, 59)
        return p

    def add_sub_section_heading(title):
        p = doc.add_paragraph(style='Heading 3')
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        r = p.add_run(title)
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.italic = True
        r.font.color.rgb = RGBColor(71, 85, 105)
        return p

    def add_body_p(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_after = Pt(6)
        r = p.add_run(text)
        r.font.size = Pt(10.5)
        return p

    def add_figure(image_filename, caption_text, width_inches=5.8):
        img_path = Path("docs/screenshots") / image_filename
        if img_path.exists():
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(8)
            p_img.paragraph_format.space_after = Pt(3)
            p_img.paragraph_format.keep_with_next = True
            r_img = p_img.add_run()
            r_img.add_picture(str(img_path), width=Inches(width_inches))

            p_cap = doc.add_paragraph()
            p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_cap.paragraph_format.space_before = Pt(2)
            p_cap.paragraph_format.space_after = Pt(10)
            r_cap = p_cap.add_run(caption_text)
            r_cap.font.size = Pt(9.5)
            r_cap.font.italic = True
            r_cap.font.bold = True
            r_cap.font.color.rgb = RGBColor(80, 80, 80)

    # =========================================================================
    # CHAPTER 1: INTRODUCTION
    # =========================================================================
    add_chapter_heading(1, "Introduction")

    add_section_heading("1.1 Background and Motivation")
    add_body_p(
        "An Operating System (OS) is the essential system software layer that acts as an intermediary between computer hardware and user-level applications. "
        "It is tasked with managing critical system hardware resources including central processing unit (CPU) instruction cycles, primary random-access memory (RAM), "
        "secondary storage blocks, persistent filesystems, and peripheral input/output devices. In undergraduate Computer Science and Engineering education, "
        "mastery of operating systems principles forms the indispensable bedrock for systems programming, cloud architecture, distributed systems, and software engineering."
    )
    add_body_p(
        "Traditionally, students explore these concepts via two disconnected paradigms: theoretical textbook study using mathematical illustrations, and low-level "
        "isolated C/C++ command-line scripts. While command-line scripts teach syntax, they frequently lack visual intuition, fail to capture multi-component state evolution, "
        "and do not illustrate how real filesystems organize bytes into persistent disk blocks. Students are left with a conceptual gap between abstract scheduling models "
        "and physical computer systems."
    )

    add_section_heading("1.2 Problem Statement")
    add_body_p(
        "The primary challenge addressed by this project is the absence of an integrated, functional engineering laboratory environment that unifies "
        "real filesystem operations (file uploads, directory hierarchies, inline editing, and analytical processing tools) with deterministic, interactive "
        "simulations of core operating system algorithms. Existing simulation tools in educational settings often present superficial graphical user interfaces "
        "with hardcoded outputs or synthetic delays rather than genuine computational execution. Consequently, students cannot manipulate authentic files while "
        "observing underlying allocation strategies, scheduling pipelines, or paging policies."
    )

    add_section_heading("1.3 Objectives of the Project")
    add_body_p("The key objectives of the MiniOS engineering platform are defined as follows:")
    
    obj_items = [
        "Develop a lightweight, local-first Mini File Storage System supporting upload, nesting, CRUD, inline editing, and quota tracking.",
        "Implement a ten-tool File Processing Workbench performing real data operations (text parsing, CSV analytics, JSON validation, compression, checksum verification, duplicate scanning, and diffing).",
        "Engineer complete, deterministic simulation engines for all 15 core algorithms specified in the six-week university OS syllabus.",
        "Provide step-by-step visualizers (Gantt charts, proportional partition maps, 64-block disk grids, matrix inspectors, and 2D cylinder trajectory graphs).",
        "Establish automated mathematical invariant checks (e.g., Turnaround Time = Completion Time − Arrival Time, Waiting Time = Turnaround Time − Burst Time, and external fragmentation checks).",
        "Build an automated Lab Report Generator that outputs verifiable, publication-ready experiment documentation in Markdown and printable formats.",
        "Verify 100% of the backend and algorithm logic through rigorous automated testing using Pytest."
    ]
    for item in obj_items:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        r = p.add_run(item)
        r.font.size = Pt(10)

    add_section_heading("1.4 Scope and Syllabus Alignment")
    add_body_p(
        "MiniOS covers the complete six-week laboratory curriculum of the standard Operating Systems course, including: "
        "Week 1 CPU Scheduling (FCFS, Non-Preemptive SJF, Round Robin, and Priority Scheduling); "
        "Week 2 Memory Allocation (First Fit, Best Fit, and Worst Fit with variable-partition models); "
        "Week 3 File Allocation (Contiguous, Indexed, and Linked List disk allocation); "
        "Week 4 Deadlock Management (Banker’s Algorithm avoidance with interactive resource request testing, and Deadlock Detection); "
        "Week 5 Page Replacement (FIFO, Optimal lookahead, and LRU); and "
        "Week 6 Disk Scheduling (SCAN, C-SCAN, and LOOK). All modules run locally on standard hardware without external API dependencies."
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 2: SYSTEM REQUIREMENTS SPECIFICATION
    # =========================================================================
    add_chapter_heading(2, "System Requirements Specification")

    add_section_heading("2.1 Functional Requirements")
    add_body_p(
        "Functional requirements delineate the explicit capabilities, services, and operational features delivered by the MiniOS platform."
    )

    add_sub_section_heading("2.1.1 Mini File Storage & Management")
    fr1 = [
        "FR 1.1 (File Upload): The system shall accept single and multiple file uploads via file selection dialogs and drag-and-drop actions.",
        "FR 1.2 (Directory Management): The system shall allow users to create, view, rename, and recursively delete nested folders with real-time breadcrumb navigation.",
        "FR 1.3 (File Persistence): Uploaded file contents shall be persisted to disk under storage/uploads/ with unique internal UUID identifiers; metadata shall be stored in SQLite.",
        "FR 1.4 (In-App Editing): The system shall provide an in-app text editor allowing users to create, modify, and save plain text, code, CSV, and JSON files directly in the browser.",
        "FR 1.5 (Storage Quota): The system shall enforce a configurable simulated quota (default: 50 MB, adjustable up to 500 MB) and reject uploads that exceed available quota.",
        "FR 1.6 (Security & Path Traversal): The system shall sanitize all filenames and prevent directory traversal (e.g., ../) across storage directories."
    ]
    for f in fr1:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(f)
        r.font.size = Pt(9.5)

    add_sub_section_heading("2.1.2 File Processing Tools")
    fr2 = [
        "FR 2.1 (Text Analyzer): The system shall compute total lines, words, characters (with and without spaces), frequent words, average word length, and reading time.",
        "FR 2.2 (CSV Inspector): The system shall detect delimiters, inspect headers, preview top rows, and calculate summary statistics (min, max, mean, unique counts).",
        "FR 2.3 (JSON Validator): The system shall parse and format JSON files, count root keys, and report exact line/column positions on syntax errors.",
        "FR 2.4 (ZIP Compressor & Extractor): The system shall bundle chosen files into standard ZIP archives and safely extract archive members with path traversal guards.",
        "FR 2.5 (Hash & Integrity Checker): The system shall compute SHA-256 and MD5 cryptographic checksums and evaluate match status against an expected user hash.",
        "FR 2.6 (Duplicate Detector): The system shall scan stored files by hash, group identical contents, and calculate total wasted capacity.",
        "FR 2.7 (File Diff): The system shall compute line-by-line unified diff comparisons between two text files, identifying added, removed, and unchanged lines.",
        "FR 2.8 (Image Metadata): The system shall extract dimensions, aspect ratio, color mode, and format for image files.",
        "FR 2.9 (Batch Processing & History): The system shall execute batch jobs across multiple files and record audit entries with duration in milliseconds."
    ]
    for f in fr2:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(f)
        r.font.size = Pt(9.5)

    add_sub_section_heading("2.1.3 OS Algorithm Simulation Modules (Weeks 1 to 6)")
    fr3 = [
        "FR 3.1 (CPU Scheduling): The system shall execute FCFS, Non-Preemptive SJF, Round Robin (configurable quantum), and Priority scheduling (configurable order). It shall compute Arrival, Burst, Completion, Turnaround, Waiting, and Response times, CPU utilization %, throughput, and context switches.",
        "FR 3.2 (Memory Allocation): The system shall simulate First Fit, Best Fit, and Worst Fit algorithms on variable-sized partitions, visualising allocated processes, free space, internal fragmentation, and allocation failures.",
        "FR 3.3 (File Allocation): The system shall allocate disk blocks using Contiguous, Indexed, and Linked strategies on a 64-block disk grid, visualising pointer chains and demonstrating external fragmentation when contiguous runs are unavailable.",
        "FR 3.4 (Deadlock Management): The system shall execute Banker's Safety Algorithm (Need = Max − Allocation, safe sequence derivation), evaluate tentative resource requests without state corruption, and execute separate Deadlock Detection using Work/Finish vectors.",
        "FR 3.5 (Page Replacement): The system shall simulate FIFO, Optimal lookahead, and LRU replacement on configurable frames, computing hit/fault counts and ratios with frame matrix tables.",
        "FR 3.6 (Disk Scheduling): The system shall simulate SCAN, C-SCAN, and LOOK disk head paths, computing total cylinder movement, average seek distance, and 2D coordinate trajectory curves."
    ]
    for f in fr3:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(f)
        r.font.size = Pt(9.5)

    add_sub_section_heading("2.1.4 Lab Report Generator")
    add_body_p(
        "FR 4.1: The system shall compile completed simulation runs into standardized laboratory reports containing Experiment Number, Title, Aim, Theoretical Background, "
        "Input Datasets, Result Tables, and Conclusions. Reports shall be exportable to Markdown (.md) and formatted for clean browser printing."
    )

    add_section_heading("2.2 Non-Functional Requirements")
    nfr_data = [
        ("Performance", "Simulations shall execute in under 100 milliseconds for standard classroom datasets (up to 50 processes / 1000 disk cylinders). File uploads under 10MB shall process within 1 second."),
        ("Reliability & Correctness", "All scheduling and allocation algorithms shall be strictly deterministic and adhere to mathematical invariants (TAT = CT − AT, WT = TAT − BT). Systems shall not crash on edge cases such as empty process lists or zero burst times."),
        ("Security & Safety", "File uploads shall be isolated in dedicated directories with UUID-prefixed filenames. ZIP slip vulnerabilities and path traversal attacks shall be actively blocked. No uploaded files shall be executed as server-side code."),
        ("Usability & UX", "The user interface shall provide a cohesive desktop-first dashboard with consistent typography, dark and light theme options, interactive step-by-step playback controls, and descriptive tooltips."),
        ("Maintainability & Modularity", "Backend algorithm logic shall remain completely decoupled from web controllers, enabling standalone CLI testing via Pytest. Frontend features shall be structured as self-contained feature modules.")
    ]
    t_nfr = doc.add_table(rows=len(nfr_data) + 1, cols=2)
    t_nfr.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_nfr)
    h_nfr = t_nfr.rows[0].cells
    h_nfr[0].text = "Requirement Dimension"
    h_nfr[1].text = "Operational Standard & Specification"
    set_cell_background(h_nfr[0], "F0F4F8")
    set_cell_background(h_nfr[1], "F0F4F8")
    h_nfr[0].paragraphs[0].runs[0].font.bold = True
    h_nfr[1].paragraphs[0].runs[0].font.bold = True
    h_nfr[0].width = Inches(2.0)
    h_nfr[1].width = Inches(4.5)

    for i, (dim, spec) in enumerate(nfr_data, start=1):
        row = t_nfr.rows[i].cells
        row[0].width = Inches(2.0)
        row[1].width = Inches(4.5)
        row[0].text = dim
        row[1].text = spec
        row[0].paragraphs[0].runs[0].font.bold = True
        row[0].paragraphs[0].runs[0].font.size = Pt(9.5)
        row[1].paragraphs[0].runs[0].font.size = Pt(9.5)
        set_cell_margins(row[0], top=60, bottom=60, left=100, right=100)
        set_cell_margins(row[1], top=60, bottom=60, left=100, right=100)

    add_section_heading("2.3 Hardware & Software Specifications")
    add_body_p(
        "• Hardware (Client/Server): Minimum 1.6 GHz dual-core processor, 4 GB RAM, 500 MB free disk space.\n"
        "• Operating System: Cross-platform compatibility on macOS (Apple Silicon / Intel), Linux (Ubuntu 20.04+), and Microsoft Windows 10/11.\n"
        "• Backend Software Stack: Python 3.10+, FastAPI 0.115+, Uvicorn 0.32+, SQLAlchemy 2.0+, Pydantic V2, Pillow 11+, Pytest 8.3+.\n"
        "• Frontend Software Stack: Node.js 18+, React 19, TypeScript, Vite 8+, Tailwind CSS 3.4+, Lucide Icons."
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 3: SYSTEM ARCHITECTURE
    # =========================================================================
    add_chapter_heading(3, "System Architecture")

    add_section_heading("3.1 Layered Architectural Model")
    add_body_p(
        "The MiniOS platform employs a decoupled four-tier layered architecture designed for local execution, modular testability, and clear separation of concerns:"
    )

    layers = [
        ("Presentation Layer (Client)", "Built using React 19, TypeScript, and Tailwind CSS. Renders dashboard layouts, file management explorers, interactive Gantt charts, SVG disk tracks, and step-by-step playback controllers."),
        ("API & Routing Layer", "Powered by FastAPI. Exposes RESTful endpoints grouped under /api/v1 (files, folders, processing, simulations, reports, overview, settings) with Pydantic request/response schema validation and CORS middleware."),
        ("Business Logic & Simulation Layer", "Houses pure Python implementations of the 15 OS algorithms and file-processing utilities. Algorithm modules compute deterministic execution traces without side effects."),
        ("Data Persistence & Storage Layer", "Consists of SQLite (minios.db) accessed via SQLAlchemy ORM for relational metadata, and the local file system (storage/uploads/ and storage/processed/) for authentic file byte persistence.")
    ]

    t_lay = doc.add_table(rows=len(layers) + 1, cols=2)
    t_lay.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_lay)
    h_lay = t_lay.rows[0].cells
    h_lay[0].text = "Architectural Tier"
    h_lay[1].text = "Responsibilities & Technologies"
    set_cell_background(h_lay[0], "F0F4F8")
    set_cell_background(h_lay[1], "F0F4F8")
    h_lay[0].paragraphs[0].runs[0].font.bold = True
    h_lay[1].paragraphs[0].runs[0].font.bold = True
    h_lay[0].width = Inches(2.2)
    h_lay[1].width = Inches(4.3)

    for i, (l_name, l_desc) in enumerate(layers, start=1):
        row = t_lay.rows[i].cells
        row[0].width = Inches(2.2)
        row[1].width = Inches(4.3)
        row[0].text = l_name
        row[1].text = l_desc
        row[0].paragraphs[0].runs[0].font.bold = True
        row[0].paragraphs[0].runs[0].font.size = Pt(9.5)
        row[1].paragraphs[0].runs[0].font.size = Pt(9.5)
        set_cell_margins(row[0], top=60, bottom=60, left=100, right=100)
        set_cell_margins(row[1], top=60, bottom=60, left=100, right=100)

    add_section_heading("3.2 Client-Server Communication Flow")
    add_body_p(
        "Communication between the React single-page application and the FastAPI server occurs over asynchronous HTTP/REST protocols. "
        "During local development, Vite proxies API requests from port 5173 to port 8000, eliminating cross-origin browser restrictions. "
        "Each request payload is validated server-side by Pydantic models. Algorithm simulation requests return comprehensive deterministic event lists "
        "(containing step numbers, time ticks, active processes, and queue states) that the frontend animates smoothly using React state hooks."
    )

    add_section_heading("3.3 Data Storage & Persistence Model")
    add_body_p(
        "To ensure high performance and prevent database bloat, MiniOS adopts an industrial storage design: "
        "raw binary and text file contents reside directly on the host filesystem under storage/uploads/, referenced via safe relative paths. "
        "The relational database strictly stores metadata (UUID, filename, MIME type, file size, SHA-256 hash, timestamps, and folder hierarchy). "
        "This prevents SQLite file degradation while preserving rapid search, sort, and retrieval operations."
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 4: SYSTEM MODELING (UML DIAGRAMS)
    # =========================================================================
    add_chapter_heading(4, "System Modeling (UML Diagrams)")

    add_body_p(
        "Unified Modeling Language (UML) structural and behavioral models are developed to formally specify the architecture, object relationships, and runtime interactions of the MiniOS system."
    )

    add_section_heading("4.1 Structural Modeling")
    
    add_sub_section_heading("4.1.1 Class Diagram")
    add_body_p(
        "The Class Diagram defines the data entities and business models implemented in the database and simulation services. "
        "Folder exhibits a self-referential parent-child relationship for nested directories and a 1-to-many relationship with FileRecord. "
        "ProcessingJob tracks file processing events, while SimulationRun stores algorithm input parameters, computed metrics, and playback steps in serialized JSON format. "
        "LabReport stores generated experiment documentation."
    )

    # Class definitions table
    classes_info = [
        ("Folder", "id: String (PK), name: String, parent_id: String (FK), created_at: DateTime, updated_at: DateTime", "children: List[Folder], files: List[FileRecord]"),
        ("FileRecord", "id: String (PK), name: String, folder_id: String (FK), file_type: String, size_bytes: Integer, storage_path: String, hash_sha256: String", "folder: Folder"),
        ("ProcessingJob", "id: String (PK), tool_name: String, status: String, input_file_ids: Text (JSON), duration_ms: Float, details: Text (JSON)", "Independent audit entity"),
        ("SimulationRun", "id: String (PK), category: String, algorithm_name: String, input_data: Text (JSON), result_data: Text (JSON), steps_data: Text (JSON)", "Historical execution log"),
        ("LabReport", "id: String (PK), experiment_no: Integer, title: String, aim: Text, description: Text, input_summary: Text, result_summary: Text, conclusion: Text", "Formal experiment report")
    ]
    t_cls = doc.add_table(rows=len(classes_info) + 1, cols=3)
    t_cls.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_cls)
    h_cls = t_cls.rows[0].cells
    h_cls[0].text = "Class Name"
    h_cls[1].text = "Attributes (Data Types)"
    h_cls[2].text = "Associations & Relationships"
    set_cell_background(h_cls[0], "F0F4F8")
    set_cell_background(h_cls[1], "F0F4F8")
    set_cell_background(h_cls[2], "F0F4F8")
    for c in h_cls:
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.size = Pt(9.5)

    for i, (cn, ca, cr) in enumerate(classes_info, start=1):
        row = t_cls.rows[i].cells
        row[0].text = cn
        row[1].text = ca
        row[2].text = cr
        row[0].paragraphs[0].runs[0].font.bold = True
        for cell in row:
            cell.paragraphs[0].runs[0].font.size = Pt(8.5)
            set_cell_margins(cell, top=50, bottom=50, left=80, right=80)

    add_sub_section_heading("4.1.2 Component Diagram")
    add_body_p(
        "The Component Diagram visualizes the modular organization of software packages. The Frontend Presentation Component contains the Viewport Router, UI Views, and API Client. "
        "The Backend Component contains the FastAPI Router layer, Service Orchestrators (StorageService, ProcessingService, ReportService), Algorithm Computation Engines (CpuScheduler, MemoryAllocator, FileAllocator, DeadlockManager, PageReplacer, DiskScheduler), "
        "and Database/Filesystem persistence adapters."
    )

    add_sub_section_heading("4.1.3 Package Diagram")
    add_body_p(
        "Packages are organized cleanly into: (1) frontend::features (modular screens), (2) backend::api (REST endpoints), "
        "(3) backend::algorithms (pure algorithmic logic), (4) backend::database (ORM schema and session management), and "
        "(5) backend::services (business orchestrators)."
    )

    add_sub_section_heading("4.1.4 Deployment Diagram")
    add_body_p(
        "The Deployment Diagram portrays physical execution nodes. The Client Workstation runs a modern web browser hosting the React single-page app via HTTP/TCP on port 5173. "
        "The Local Server Node executes Python 3 running the Uvicorn ASGI server on port 8000, connecting to SQLite via local filesystem sockets and managing files in storage/uploads/."
    )

    add_section_heading("4.2 Behavioral Modeling")
    
    add_sub_section_heading("4.2.1 Use Case Diagram")
    add_body_p(
        "Primary Actors: Student / Lab Instructor, Operating System Simulator.\n"
        "Key Use Cases: (1) Upload and Organize Files, (2) Edit Text/Code In-App, (3) Execute Processing Workbench (Hash, Diff, Inspect), "
        "(4) Simulate CPU Scheduling Algorithms, (5) Simulate Memory Partition Allocation, (6) Simulate Disk Block File Allocation, "
        "(7) Execute Banker's Algorithm & Test Resource Requests, (8) Execute Deadlock Detection, (9) Simulate Virtual Memory Page Replacement, "
        "(10) Simulate Disk Arm Scheduling, (11) Generate and Export Lab Experiment Reports, and (12) Configure System Quotas."
    )

    add_sub_section_heading("4.2.2 Activity Diagram")
    add_body_p(
        "Illustrates execution flow: User selects algorithm module → User enters custom process/memory/disk parameters or loads verified syllabus preset → "
        "System validates inputs against schema bounds → System computes deterministic simulation steps and summary metrics → "
        "System displays visual Gantt/memory/disk representations → User interacts with step playback controller (Play/Pause/Step) → "
        "User clicks 'Generate Lab Report' → System auto-populates aim, theory, results, and conclusion → User exports Markdown or prints PDF."
    )

    add_sub_section_heading("4.2.3 Sequence Diagram")
    add_body_p(
        "Traces runtime message passing: React Component issues POST request to FastAPI endpoint → Endpoint validates parameters via Pydantic model → "
        "Algorithm service executes deterministic computation loop → Service persists run record in SQLite SimulationRun table → "
        "Endpoint serializes response JSON → React Component updates internal state → Visual chart renders animated execution sequence."
    )

    add_sub_section_heading("4.2.4 State Chart Diagram")
    add_body_p(
        "Models the simulation lifecycle states: Idle → Parameters_Configured → Simulating → Results_Ready → Stepping_Forward / Stepping_Back → Playback_Paused → Report_Generated."
    )

    add_sub_section_heading("4.2.5 Communication Diagram")
    add_body_p(
        "Depicts object interactions: FileManagerView interacts with StorageService to retrieve metadata; ProcessingView communicates with ProcessingService to compute file digests and diffs; "
        "SimulationViews interact with respective Algorithm Modules to return timeline event queues."
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 5: IMPLEMENTATION
    # =========================================================================
    add_chapter_heading(5, "Implementation")

    add_section_heading("5.1 Backend REST API & Services")
    add_body_p(
        "The backend is developed with FastAPI and SQLAlchemy. The core architectural principle is that all algorithm implementations are genuine, "
        "independently testable pure functions located under backend/app/algorithms/. The API routers under backend/app/api/ receive client requests, "
        "invoke the corresponding algorithm or storage service, persist execution audit records, and return standardized JSON payloads."
    )

    add_section_heading("5.2 OS Algorithm Engine (All 15 Syllabus Algorithms)")

    add_sub_section_heading("5.2.1 Week 1: CPU Scheduling Algorithms")
    add_body_p(
        "Implemented in backend/app/algorithms/cpu_scheduling/: \n"
        "1. First Come First Serve (FCFS): Orders processes strictly by arrival time. Handles CPU idle intervals when arrival times have gaps.\n"
        "2. Shortest Job First (SJF, Non-Preemptive): At current time t, selects from arrived processes the one with minimal burst time. Tie-breakers: arrival time, then PID.\n"
        "3. Round Robin (RR): Employs a FIFO ready queue and time quantum Q. Handles process arrival order during quantum slices. Re-enqueues unfinished processes behind newly arrived jobs.\n"
        "4. Priority Scheduling: Supports both 'lower number is higher priority' and 'higher number is higher priority' conventions.\n"
        "Mathematical Invariants Enforced: Completion Time (CT), Turnaround Time TAT = CT − AT, Waiting Time WT = TAT − BT, Response Time RT = First_Execution − AT."
    )

    add_sub_section_heading("5.2.2 Week 2: Memory Allocation Algorithms")
    add_body_p(
        "Implemented in backend/app/algorithms/memory_allocation/fit_algorithms.py:\n"
        "1. First Fit: Scans partition blocks sequentially from index 0 and allocates the first block with capacity >= process size.\n"
        "2. Best Fit: Scans all blocks and allocates the block with capacity >= process size that minimizes leftover space (tightest fit).\n"
        "3. Worst Fit: Scans all blocks and allocates the block with capacity >= process size that maximizes leftover space (loosest fit).\n"
        "Tracks internal fragmentation (unused space inside allocated blocks in fixed-partition models) and records allocation failure reasons for oversized processes."
    )

    add_sub_section_heading("5.2.3 Week 3: File Allocation Strategies")
    add_body_p(
        "Implemented in backend/app/algorithms/file_allocation/strategies.py:\n"
        "1. Contiguous Allocation: Allocates consecutive sectors. Detects External Fragmentation when total free blocks >= requested but no contiguous run exists.\n"
        "2. Indexed Allocation: Allocates a dedicated index block that holds references to scattered data blocks. Displays storage overhead (1 index block per file).\n"
        "3. Linked Allocation: Allocates data blocks scattered across the disk grid, storing pointer chains (block_id -> next_block_id -> EOF)."
    )

    add_sub_section_heading("5.2.4 Week 4: Deadlock Avoidance and Detection")
    add_body_p(
        "Implemented in backend/app/algorithms/deadlocks/:\n"
        "1. Banker's Algorithm (Avoidance): Computes Need Matrix = Max_Demand − Allocation. Implements the Safety Algorithm using Work and Finish vectors to determine if a Safe Sequence exists. "
        "Implements Resource-Request Evaluation: verifies Request <= Need and Request <= Available, pretends to allocate, runs safety check, and safely rolls back if unsafe.\n"
        "2. Deadlock Detection: Analyzes current Allocation and pending Request matrices without knowing maximum demands. Progressively reclaims resources from processes whose requests can be satisfied; "
        "processes remaining with Finish[i] == False are flagged as deadlocked."
    )

    add_sub_section_heading("5.2.5 Week 5: Page Replacement Algorithms")
    add_body_p(
        "Implemented in backend/app/algorithms/page_replacement/replacement.py:\n"
        "1. FIFO: Evicts the oldest loaded page using a queue.\n"
        "2. Optimal: Looks ahead into future reference string and evicts the page that will not be used for the longest period (or never again). Generates a future lookahead map for every step.\n"
        "3. LRU: Tracks timestamps of page accesses and evicts the least recently accessed page.\n"
        "Computes hit count, fault count, hit ratio, and fault ratio across frame buffer sizes (1 to 10 frames)."
    )

    add_sub_section_heading("5.2.6 Week 6: Disk Scheduling Algorithms")
    add_body_p(
        "Implemented in backend/app/algorithms/disk_scheduling/disk_algorithms.py:\n"
        "1. SCAN (Elevator): Sweeps in the active direction servicing cylinders until reaching the boundary, then reverses.\n"
        "2. C-SCAN (Circular): Sweeps in the active direction to the boundary, jumps to the opposite boundary cylinder (without servicing), and continues in the original direction.\n"
        "3. LOOK: Sweeps only to the furthest request in the active direction, then immediately reverses without traveling to physical boundaries.\n"
        "Calculates exact head seek trajectories, total movement in cylinders, and average seek distance per request."
    )

    add_section_heading("5.3 File Processing Workbench Implementation")
    add_body_p(
        "The processing workbench provides ten robust tools implemented in backend/app/services/processing_service.py: "
        "TextAnalyzer uses regular expressions and collections.Counter; CSVAnalyzer uses csv.Sniffer and numeric aggregators; "
        "JSONValidator parses JSON and captures JSONDecodeError line/column positions; Compressor and Extractor use zipfile with path normalization "
        "to prevent directory traversal; HashGenerator computes SHA-256 and MD5 using 64KB chunk streaming; DuplicateDetector groups files by SHA-256; "
        "FileDiff utilizes difflib.unified_diff; and ImageMetadata uses Pillow to extract dimensions and color spaces."
    )

    add_section_heading("5.4 Frontend Interface & Interactive Visualizers")
    add_body_p(
        "The frontend is constructed using React 19 functional components with TypeScript and Tailwind CSS. Key visualizers include: "
        "(1) Interactive Gantt Chart with idle intervals, process colors, and hover tooltips; (2) Step Controller enabling Play/Pause, Step Forward/Back, Speed adjustment, and reset; "
        "(3) Proportional Memory Blocks showing process occupancy and internal fragmentation; (4) 64-Block Disk Grid with sector inspectors and pointer chain displays; "
        "(5) Matrix Tables with inline editing; (6) Frame Matrix with Hit/Fault badges; and (7) 2D Coordinate Disk Seek Trajectory line charts."
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 6: TEST CASES & AUTOMATED VERIFICATION
    # =========================================================================
    add_chapter_heading(6, "Test Cases & Automated Verification")

    add_section_heading("6.1 Automated Pytest Testing Suite")
    add_body_p(
        "Software reliability and algorithmic correctness were verified through automated unit and integration tests using Pytest. "
        "A total of 23 test cases were implemented across 7 test suites in backend/app/tests/. "
        "Tests execute against mathematical invariants, known academic benchmark reference strings, and rigorous boundary/edge conditions."
    )

    add_section_heading("6.2 Mathematical Invariants & Verification Results")
    add_body_p(
        "• CPU Scheduling: Verified that TAT = CT − AT and WT = TAT − BT hold across all processes under FCFS, SJF, RR, and Priority.\n"
        "• Memory Allocation: Verified that allocated partition size matches requested process size, and that internal fragmentation equals partition capacity minus process size.\n"
        "• File Allocation: Verified that contiguous allocation flags external fragmentation when total free blocks >= requested size but consecutive blocks are broken.\n"
        "• Deadlock Avoidance: Verified Banker's algorithm safe sequence against Dijkstra's reference state ([P1, P3, P4, P0, P2]) and confirmed that unsafe requests are rejected without corrupting state.\n"
        "• Page Replacement: Verified standard textbook reference string [7,0,1,2,0,3,0,4,2,3,0,3,2,1,2,0,1,7,0,1] across 3 frames: FIFO produced 15 faults, LRU produced 12 faults, and Optimal produced 9 faults.\n"
        "• Disk Scheduling: Verified head movement on textbook queue [98, 183, 37, 122, 14, 124, 65, 67] starting at cylinder 53: SCAN produced 331 cylinders; LOOK produced 299 cylinders."
    )

    add_section_heading("6.3 Comprehensive Test Execution Table (23 Passing Tests)")
    
    test_cases_table = [
        ("TC-01", "test_api_root", "GET /", "Status 200, app metadata returned", "Status 200, verified", "PASS"),
        ("TC-02", "test_overview_stats", "GET /api/v1/overview/stats", "Quota stats and syllabus progress returned", "Valid stats JSON", "PASS"),
        ("TC-03", "test_file_create_and_delete", "POST /files/create-text, PUT, GET, DEL", "File created, updated, content retrieved, deleted", "All CRUD operations succeeded", "PASS"),
        ("TC-04", "test_simulation_api_cpu", "POST /simulations/cpu (FCFS)", "Status 200, Gantt chart, metrics calculated", "Gantt & metrics verified", "PASS"),
        ("TC-05", "test_report_generation_api", "POST /reports, GET, download", "Report created and downloaded as markdown", "Markdown downloaded correctly", "PASS"),
        ("TC-06", "test_fcfs_basic_and_invariants", "3 processes with arrival times 0, 1, 2", "Invariants TAT = CT − AT and WT = TAT − BT verified", "Invariants confirmed", "PASS"),
        ("TC-07", "test_fcfs_idle_cpu", "P1 at t=2, P2 at t=7", "Gantt records idle periods [0,2] and [5,7]", "Idle blocks verified", "PASS"),
        ("TC-08", "test_sjf_non_preemptive", "P1(7), P2(4), P3(1), P4(4)", "Shortest burst selected; completion: P1:7, P3:8, P2:12, P4:16", "Correct SJF execution", "PASS"),
        ("TC-09", "test_round_robin_quantum", "P1(5), P2(3), P3(1), Q=2", "Time-sliced queueing, total makespan = 9", "Queue order & metrics verified", "PASS"),
        ("TC-10", "test_priority_scheduling", "P1(prio 3), P2(prio 1), P3(prio 2)", "Lower number = higher priority order verified", "Priority order verified", "PASS"),
        ("TC-11", "test_bankers_safety_and_request", "5 processes, 3 resource types, safe state", "Safe sequence found, unsafe request evaluated", "Safe sequence [P1,...] verified", "PASS"),
        ("TC-12", "test_deadlock_detection", "Deadlocked resource request cycle", "is_deadlocked=True, deadlocked processes identified", "P0 and P1 identified as deadlocked", "PASS"),
        ("TC-13", "test_disk_scheduling_scan_and_look", "Head at 53, range 200, 8 requests", "SCAN total = 331 cylinders; LOOK total = 299 cylinders", "SCAN=331, LOOK=299 verified", "PASS"),
        ("TC-14", "test_c_scan", "C-SCAN right sweep with circular wraparound", "Boundary jump recorded from 199 to 0", "Boundary jump step verified", "PASS"),
        ("TC-15", "test_contiguous_allocation_and_frag", "Scattered blocks, request 2 contiguous blocks", "External fragmentation detected, failure flagged", "External fragmentation caught", "PASS"),
        ("TC-16", "test_indexed_allocation_with_overhead", "File of size 3 blocks under Indexed", "1 index block + 3 data blocks allocated", "Overhead = 1 block verified", "PASS"),
        ("TC-17", "test_linked_allocation", "File of size 4 blocks under Linked", "Pointer chain block -> next -> -1 (EOF) created", "Pointer chain verified", "PASS"),
        ("TC-18", "test_text_analysis", "Text file with 2 lines, 12 words", "line_count=2, word_count=12, frequent words computed", "Counts & stats verified", "PASS"),
        ("TC-19", "test_csv_analysis", "CSV with numeric columns", "Rows=3, Cols=2, min=5, max=15, mean=10", "Numeric stats verified", "PASS"),
        ("TC-20", "test_json_validation", "Valid JSON vs invalid syntax JSON", "Valid parsed with keys; invalid reports line error", "Syntax validation verified", "PASS"),
        ("TC-21", "test_memory_allocation_first_best_worst", "Blocks [100,500,200,300,600], Proc P1(212)", "First Fit picks Block 2, Best Fit picks 4, Worst picks 5", "Block selections verified", "PASS"),
        ("TC-22", "test_memory_allocation_failure", "Block [50], Process [100]", "Allocated count = 0, unallocated = 1, status = failed", "Failure handled gracefully", "PASS"),
        ("TC-23", "test_page_replacement_algorithms", "Reference string [7,0,1,2,0,3...], 3 frames", "FIFO faults = 15; LRU faults = 12; Optimal faults = 9", "Fault counts exactly verified", "PASS")
    ]

    t_tc = doc.add_table(rows=len(test_cases_table) + 1, cols=6)
    t_tc.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(t_tc)
    h_tc = t_tc.rows[0].cells
    h_tc[0].text = "Test ID"
    h_tc[1].text = "Test Function"
    h_tc[2].text = "Test Input / Scenario"
    h_tc[3].text = "Expected Outcome"
    h_tc[4].text = "Actual Outcome"
    h_tc[5].text = "Status"
    set_cell_background(h_tc[0], "F0F4F8")
    set_cell_background(h_tc[1], "F0F4F8")
    set_cell_background(h_tc[2], "F0F4F8")
    set_cell_background(h_tc[3], "F0F4F8")
    set_cell_background(h_tc[4], "F0F4F8")
    set_cell_background(h_tc[5], "F0F4F8")
    for c in h_tc:
        c.paragraphs[0].runs[0].font.bold = True
        c.paragraphs[0].runs[0].font.size = Pt(8.5)

    h_tc[0].width = Inches(0.7)
    h_tc[1].width = Inches(1.5)
    h_tc[2].width = Inches(1.5)
    h_tc[3].width = Inches(1.5)
    h_tc[4].width = Inches(1.0)
    h_tc[5].width = Inches(0.6)

    for i, (tid, tfn, tinp, texp, tact, tstat) in enumerate(test_cases_table, start=1):
        row = t_tc.rows[i].cells
        row[0].width = Inches(0.7)
        row[1].width = Inches(1.5)
        row[2].width = Inches(1.5)
        row[3].width = Inches(1.5)
        row[4].width = Inches(1.0)
        row[5].width = Inches(0.6)

        row[0].text = tid
        row[1].text = tfn
        row[2].text = tinp
        row[3].text = texp
        row[4].text = tact
        row[5].text = tstat

        row[0].paragraphs[0].runs[0].font.bold = True
        row[5].paragraphs[0].runs[0].font.bold = True
        row[5].paragraphs[0].runs[0].font.color.rgb = RGBColor(16, 120, 50)

        for cell in row:
            cell.paragraphs[0].runs[0].font.size = Pt(8.0)
            set_cell_margins(cell, top=40, bottom=40, left=60, right=60)

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 7: RESULTS & VISUALIZATIONS
    # =========================================================================
    add_chapter_heading(7, "Results & Visualizations")

    add_section_heading("7.1 Mini File Storage & Quota Dashboard")
    add_body_p(
        "The Mini File Storage explorer provides complete directory navigation and file CRUD functionality. "
        "Users can upload files via drag-and-drop or file pickers. Uploaded files are safely stored in storage/uploads/ "
        "and metadata is indexed in SQLite. The in-app editor allows direct editing of text, code, CSV, and JSON files. "
        "The live storage meter dynamically calculates consumed bytes against the simulated quota limit (default: 50MB)."
    )
    add_figure("overview_dashboard_1792598263947.png", "Figure 7.1: MiniOS Overview Dashboard displaying real-time system metrics, recent storage files, and simulation modules", width_inches=5.8)
    add_figure("my_files_page_1792598277669.png", "Figure 7.2: Mini File Storage Explorer with file type filter badges, metadata cards, and dynamic quota usage bar", width_inches=5.8)

    add_section_heading("7.2 File Processing Suite Execution")
    add_body_p(
        "The file processing workbench executes real computational tasks across files: "
        "The Text Analyzer computes word and line statistics; the CSV Inspector calculates column distributions; "
        "the JSON Validator formats syntax and identifies errors; the Compressor/Extractor handles ZIP archives; "
        "the Hash Generator computes SHA-256/MD5 checksums; the Duplicate Detector discovers matching hashes and calculates wasted bytes; "
        "and the File Diff tool provides line-by-line visual delta comparisons."
    )
    add_figure("file_processing_page_1792598327621.png", "Figure 7.3: File Processing Workbench offering 10 analytical, transformation, and inspection tools", width_inches=5.8)
    add_figure("file_processing_output_1792598378929.png", "Figure 7.4: File Processing Tool Output displaying live word count metrics, sentence stats, and reading duration", width_inches=5.8)

    add_section_heading("7.3 OS Lab Simulation Outputs & Visual Charts")
    add_body_p(
        "Empirical simulation outputs across the six syllabus modules demonstrate deterministic correctness:"
    )

    sim_summaries = [
        ("Week 1: CPU Scheduling", "Generated interactive Gantt chart for Round Robin (Q=2) across 4 processes. Average Turnaround Time = 7.75 units, Average Waiting Time = 3.25 units, CPU Utilization = 100%, and 6 context switches. Mathematical invariants verified."),
        ("Week 2: Memory Allocation", "Simulated First Fit, Best Fit, and Worst Fit across 5 blocks [100, 500, 200, 300, 600] KB and 4 processes. Best Fit minimized total internal fragmentation (153 KB vs Worst Fit's 728 KB), illustrating partition preservation."),
        ("Week 3: File Allocation", "Simulated Contiguous, Indexed, and Linked allocation on a 64-block disk grid. Demonstrated external fragmentation in Contiguous allocation when 10 scattered free blocks could not satisfy a 5-block consecutive request. Indexed allocation confirmed 1-block index overhead."),
        ("Week 4: Deadlocks", "Banker's Algorithm evaluated 5 processes and 3 resources, confirming a safe state with sequence P1 -> P3 -> P4 -> P0 -> P2. Tentative resource request P1 [1,0,2] was evaluated and granted safely. Deadlock Detection identified circular waits accurately."),
        ("Week 5: Page Replacement", "Executed FIFO, Optimal, and LRU across a 20-reference string on 3 frames. Fault counts: Optimal = 9 faults (45.0% fault ratio), LRU = 12 faults (60.0% fault ratio), FIFO = 15 faults (75.0% fault ratio). Optimal lookahead visualizer displayed exact future distance."),
        ("Week 6: Disk Scheduling", "Simulated SCAN, C-SCAN, and LOOK on 8 cylinder requests starting at head 53. Total head movements: LOOK = 299 cylinders, SCAN = 331 cylinders. Trajectory line graph illustrated boundary travel and circular wraparound jumps.")
    ]

    for mod_title, mod_res in sim_summaries:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(f"• {mod_title}: ")
        r.font.bold = True
        r.font.size = Pt(10)
        r2 = p.add_run(mod_res)
        r2.font.size = Pt(10)

    add_figure("disk_scheduling_simulation_1792598601432.png", "Figure 7.5: Interactive Disk Scheduling Simulation (C-SCAN / LOOK) rendering interactive cylinder travel trajectory graph and metrics", width_inches=5.8)

    add_section_heading("7.4 Generated Lab Report Documentation")
    add_body_p(
        "Completed simulations can be compiled directly into formal laboratory experiment reports. "
        "The generated reports automatically synthesize input vectors, execution event sequences, performance metrics, and analytical conclusions. "
        "Reports can be downloaded as Markdown (.md) or printed as clean formatted PDFs directly from the browser."
    )

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 8: CONCLUSION & FUTURE ENHANCEMENTS
    # =========================================================================
    add_chapter_heading(8, "Conclusion & Future Enhancements")

    add_section_heading("8.1 Summary of Achievements")
    add_body_p(
        "The MiniOS — File Storage & Processing Lab project has been successfully designed, implemented, and empirically verified. "
        "The platform bridges operating systems theory with practical software engineering by offering a dual-purpose environment: "
        "an authentic local file storage and processing workbench coupled with deterministic, interactive simulations for all 15 algorithms in the university OS syllabus. "
        "Every button, simulation control, and file tool is fully functional without reliance on simulated mock timers or synthetic data. "
        "All 23 backend automated test cases passed, proving the mathematical validity of scheduling invariants, memory allocation partitions, and disk trajectory totals."
    )

    add_section_heading("8.2 Future Scope & Extensions")
    add_body_p("Key avenues for future enhancement include:")
    f_items = [
        "Multi-User Authentication & Access Control Lists (ACLs): Implement JWT-based authentication and role-based permissions (Admin, Student, Faculty) to manage file permissions and private lab workspaces.",
        "Cloud Object Storage Driver: Introduce S3-compatible cloud storage connectors (e.g., AWS S3 or MinIO) to complement the local disk storage provider.",
        "Kernel Syscall Hooks / eBPF Integration: Extend the simulation engine to capture real OS system calls (e.g., fork(), read(), write(), mmap()) using eBPF probes on Linux host environments.",
        "Preemptive SJF (SRTF) and Priority Preemption: Expand the CPU scheduling module to include Shortest Remaining Time First (SRTF) and preemptive priority algorithms with live queue re-ordering.",
        "Interactive Disk Cylinder 3D Visualizer: Incorporate WebGL/Three.js rendering for physical spinning platters and read/write actuator arm motion."
    ]
    for item in f_items:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(item)
        r.font.size = Pt(10)

    doc.add_page_break()

    # =========================================================================
    # CHAPTER 9: REFERENCES
    # =========================================================================
    add_chapter_heading(9, "References")

    refs = [
        "Silberschatz, Abraham, Peter Baer Galvin, and Greg Gagne. Operating System Concepts. 10th ed., John Wiley & Sons, 2018.",
        "Tanenbaum, Andrew S., and Herbert Bos. Modern Operating Systems. 4th ed., Pearson Education, 2015.",
        "Pressman, Roger S., and Bruce R. Maxim. Software Engineering: A Practitioner’s Approach. 8th ed., McGraw-Hill Education, 2015.",
        "Sommerville, Ian. Software Engineering. 10th ed., Pearson Education, 2015.",
        "Dijkstra, Edsger W. “Cooperating Sequential Processes.” Programming Languages, edited by F. Genuys, Academic Press, 1968, pp. 43–112.",
        "FastAPI Contributors. “FastAPI Documentation: High Performance Python Web Framework.” FastAPI, https://fastapi.tiangolo.com/. Accessed Oct. 2026.",
        "React Community. “React 19 Documentation: User Interfaces.” React, https://react.dev/. Accessed Oct. 2026.",
        "Mozilla Developer Network (MDN). “Web APIs and JavaScript Documentation.” MDN Web Docs, https://developer.mozilla.org/. Accessed Oct. 2026.",
        "Python Software Foundation. “Python 3.13 Standard Library Documentation.” Python.org, https://docs.python.org/3/. Accessed Oct. 2026.",
        "SQLite Development Team. “SQLite File Format and Architecture.” SQLite.org, https://www.sqlite.org/. Accessed Oct. 2026."
    ]

    for i, ref in enumerate(refs, start=1):
        p = doc.add_paragraph()
        p.paragraph_format.left_indent = Inches(0.4)
        p.paragraph_format.first_line_indent = Inches(-0.4)
        p.paragraph_format.space_after = Pt(6)
        r_num = p.add_run(f"[{i}] ")
        r_num.font.bold = True
        r_num.font.size = Pt(10)
        r_txt = p.add_run(ref)
        r_txt.font.size = Pt(10)

    output_path = Path("/Users/sanvithaganji/Desktop/os-cbp/MiniOS_OS_Lab_Project_Report.docx")
    doc.save(str(output_path))
    print(f"Report successfully saved to {output_path}")

if __name__ == "__main__":
    build_report()
