// app/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import axios from 'axios';
import jsPDF from 'jspdf';
import Link from 'next/link';
import { useEffect, useState } from 'react';

enum FormSubmissionStatus {
  Null = 'Null',
  Submitting = 'Submitting',
  Submitted = 'Submitted',
}

const FormPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [product, setProduct] = useState('standard');
  const [status, setStatus] = useState('');
  const [formSubmissionStatus, setFormSubmissionStatus] = useState(
    FormSubmissionStatus.Null,
  );
  const [pdf, setPdf] = useState<File | null>(null);
  const [redirectUrl, setRedirectUrl] = useState('');

  useEffect(() => {
    (async () => {
      const storedFirstName = localStorage.getItem('firstName');
      const storedLastName = localStorage.getItem('lastName');
      const storedEmail = localStorage.getItem('email');
      const storedProduct = localStorage.getItem('product');
      const storedFormSubmissionStatus = localStorage.getItem(
        'formSubmissionStatus',
      );
      const storedRedirectUrl = localStorage.getItem('redirectUrl');
      if (
        storedFirstName &&
        storedLastName &&
        storedEmail &&
        storedProduct &&
        storedFormSubmissionStatus &&
        storedRedirectUrl
      ) {
        setFirstName(storedFirstName);
        setLastName(storedLastName);
        setEmail(storedEmail);
        setProduct(storedProduct);

        setRedirectUrl(storedRedirectUrl);
        // regenerate the pdf file from the string
        const regeneratedPdf = await generatePDF(
          storedFirstName,
          storedLastName,
          storedEmail,
          storedProduct,
        );
        setPdf(regeneratedPdf);
        setFormSubmissionStatus(FormSubmissionStatus.Submitted);
      }
    })();
  }, []);

  async function generatePDF(
    firstName: string,
    lastName: string,
    email: string,
    product: string,
  ) {
    const doc = new jsPDF();

    // Set font for the document
    doc.setFont('helvetica', 'bold');

    // Add a title
    doc.setFontSize(22);
    doc.setTextColor(33, 150, 243); // Set text color to blue
    doc.text('Order Confirmation', 105, 20, { align: 'center' });

    // Add a greeting
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Set text color to black
    doc.text(`Dear ${firstName} ${lastName},`, 20, 40);

    // Add a message
    doc.setFontSize(14);
    doc.text(`Thank you for your order.`, 20, 60);
    doc.text(`You have chosen the following product: ${product}.`, 20, 70);
    doc.text(
      `We appreciate your business and look forward to serving you again.`,
      20,
      80,
    );

    // Add a closing
    doc.setFontSize(16);
    doc.text('Best Regards,', 20, 100);
    doc.text('Awesome Co.', 20, 110);

    // Generate PDF and get it as a Blob
    const pdfBlob = doc.output('blob');
    const pdfFile: File = new File([pdfBlob], 'file.pdf', {
      type: 'application/pdf',
    });
    setPdf(pdfFile);

    return pdfFile;
  }

  const downloadPdf = () => {
    if (!pdf) {
      return;
    }
    // Create a temporary anchor element to trigger the download
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(pdf);
    downloadLink.download = `example_form.pdf`; // Specify the filename
    downloadLink.click();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setFormSubmissionStatus(FormSubmissionStatus.Submitting);

      const pdfFile = await generatePDF(firstName, lastName, email, product);

      const bodyFormData = new FormData();
      bodyFormData.append('FirstName', firstName);
      bodyFormData.append('LastName', lastName);
      bodyFormData.append('SigningEmail', email);
      bodyFormData.append('File', pdfFile);

      const response = await axios.post('/api/submit', bodyFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.data;

      setFormSubmissionStatus(FormSubmissionStatus.Submitted);

      // store everyting in local storage
      localStorage.setItem('firstName', firstName);
      localStorage.setItem('lastName', lastName);
      localStorage.setItem('email', email);
      localStorage.setItem('product', product);
      localStorage.setItem('pdf', JSON.stringify(pdfFile));
      localStorage.setItem('redirectUrl', data.redirectUrl);

      // Redirect to url in new page
      setRedirectUrl(data.redirectUrl);
    } catch (error) {
      console.error('There was a problem with the form submission:', error);
    }
  };

  async function setToProcessing() {
    if (!email) {
      return;
    }
    axios.post('/api/update-identification-status', {
      email,
      status: 'processing',
    });
  }

  const clearLocalStorage = () => {
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');
    localStorage.removeItem('email');
    localStorage.removeItem('product');
    localStorage.removeItem('formSubmissionStatus');
    localStorage.removeItem('pdf');
    localStorage.removeItem('redirectUrl');
    setFirstName('');
    setLastName('');
    setEmail('');
    setProduct('standard');
    setFormSubmissionStatus(FormSubmissionStatus.Null);
    setPdf(null);
    setRedirectUrl('');
  };

  useEffect(() => {
    if (formSubmissionStatus === FormSubmissionStatus.Submitted) {
      // Check if form has been submitted before listening for updates
      const eventSource = new EventSource(`/api/status-updates?email=${email}`);
      eventSource.onmessage = (event) => {
        setStatus(event.data);
      };

      return () => {
        eventSource.close();
      };
    }
  }, [formSubmissionStatus, firstName, lastName, email, product]);

  if (formSubmissionStatus === FormSubmissionStatus.Submitting) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
          {/* some fancy animation ... this might take a while */}

          <h1 className="text-4xl font-bold mb-8">
            Submitting Form...this might take a bit
          </h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold mb-8">Client Demo</h1>
        {formSubmissionStatus === FormSubmissionStatus.Null && (
          <form
            onSubmit={handleSubmit}
            className="p-4 w-full bg-white shadow-md rounded-md "
          >
            <div className="flex flex-col gap-8">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-left text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-left text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-left text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="product"
                  className="block text-left text-sm font-medium text-gray-700"
                >
                  Preferred Product
                </label>
                <select
                  id="product"
                  name="product"
                  value={product}
                  onChange={(e: any) => setProduct(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <Button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Submit
              </Button>
            </div>
          </form>
        )}

        {formSubmissionStatus === FormSubmissionStatus.Submitted && (
          <>
            {/* Preview of contract */}
            <h2 className="text-2xl font-bold mt-4">Contract Preview</h2>
            <iframe
              src={pdf ? URL.createObjectURL(pdf) : ''}
              className="w-full h-96 mt-4"
              title="Contract Preview"
            />
            <h2 className="text-2xl font-bold mt-4">Actions</h2>
            <div className="flex flex-col gap-4">
              <Button onClick={downloadPdf} size="lg">
                Download Unsigned Contract
              </Button>
              <Link href={redirectUrl} target="_blank">
                <Button size="lg" onClick={setToProcessing}>
                  Sign Contract
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-lg text-blue-500">Status: {status}</p>
          </>
        )}
        <Button onClick={clearLocalStorage} className="mt-4">
          Clear Form Data
        </Button>
      </main>
    </div>
  );
};

export default FormPage;
