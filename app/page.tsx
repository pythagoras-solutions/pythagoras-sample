// app/page.tsx
'use client';

import axios from 'axios';
import jsPDF from 'jspdf';
import { useEffect, useState } from 'react';

const FormPage = () => {
  const [username, setUsername] = useState('');
  const [product, setProduct] = useState('standard');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const pdfBlob = await generatePDF(username, product);
    const pdfFile: File = new File([pdfBlob], 'file.pdf', {
      type: 'application/pdf',
    });
    console.log('🚀 ~ handleSubmit ~ pdfFile:', pdfFile);

    // Create a temporary anchor element to trigger the download
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(pdfFile);
    downloadLink.download = `example_form.pdf`; // Specify the filename
    downloadLink.click();

    const bodyFormData = new FormData();
    bodyFormData.append('FirstName', username);
    bodyFormData.append('LastName', 'dude');
    bodyFormData.append('SigningEmail', `${username}@thedude.com`);
    bodyFormData.append('File', pdfFile);

    try {
      const response = await axios.post('/api/submit', bodyFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.data;

      setMessage('Form submitted successfully!');
      console.log('Form submitted successfully:', data);

      setFormSubmitted(true); // Update formSubmitted state after submission

      // Convert the base64 PDF data to a Blob

      // Create a temporary anchor element to trigger the download
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(pdfFile);
      downloadLink.download = `example_form.pdf`; // Specify the filename
      downloadLink.click();

      // Redirect to url in new page
      window.open(data.redirectUrl, '_blank');
    } catch (error) {
      setMessage('There was a problem with the form submission.');
      console.error('There was a problem with the form submission:', error);
    }
  };

  async function generatePDF(username: string, product: string): Promise<Blob> {
    const doc = new jsPDF();

    // Add content to the PDF
    doc.text(`Hi ${username},`, 10, 10);
    doc.text(
      `You have chosen ${product}. Thank you for submitting the form.`,
      10,
      20,
    );

    // Generate PDF and get it as a Blob
    const pdfBlob = doc.output('blob');

    return pdfBlob;
  }

  useEffect(() => {
    if (formSubmitted) {
      // Check if form has been submitted before listening for updates
      const eventSource = new EventSource(
        `/api/status-updates?clientID=${username}`,
      );
      eventSource.onmessage = (event) => {
        setStatus(event.data);
      };

      return () => {
        eventSource.close();
      };
    }
  }, [formSubmitted, username]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mb-8">Client Identification Form</h1>
        <form
          onSubmit={handleSubmit}
          className="max-w-md mx-auto p-4 bg-white shadow-md rounded-md"
        >
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="product"
              className="block text-sm font-medium text-gray-700"
            >
              Preferred Product
            </label>
            <select
              id="product"
              name="product"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Submit
          </button>
        </form>
        {message && <p className="mt-4 text-lg text-green-500">{message}</p>}
        {status && (
          <p className="mt-4 text-lg text-blue-500">Status: {status}</p>
        )}
      </main>
    </div>
  );
};

export default FormPage;
