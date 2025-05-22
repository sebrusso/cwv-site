export default function PaperPage() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Research Paper</h1>
      <object
        data="/paper.pdf"
        type="application/pdf"
        width="100%"
        height="800px"
      >
        <p>
          It appears your browser cannot display PDFs. You can
          <a href="/paper.pdf" className="underline">download the PDF</a> instead.
        </p>
      </object>
      <a href="/paper.pdf" className="underline">Download PDF</a>
    </div>
  );
}
