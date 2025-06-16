import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface EquipmentAttachment {
  id: string;
  equipment_id: string;
  serial_number: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  uploaded_by: string;
  uploaded_at: string;
  description?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const { equipment_id, serial_number } = req.query;

      let query = supabaseAdmin.from('equipment_attachments').select('*');
      
      if (equipment_id) {
        query = query.eq('equipment_id', equipment_id);
      }
      
      if (serial_number) {
        query = query.eq('serial_number', serial_number);
      }

      const { data: attachments, error } = await query.order('uploaded_at', { ascending: false });

      if (error) {
        console.error('Attachments fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch attachments' });
      }

      return res.status(200).json({ attachments });
    } catch (error) {
      console.error('Attachments API error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const form = formidable({
        uploadDir: './uploads/equipment',
        keepExtensions: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB limit
        filter: ({ mimetype }) => {
          return mimetype === 'application/pdf' || false;
        }
      });

      // Ensure upload directory exists
      const uploadDir = './uploads/equipment';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const [fields, files] = await form.parse(req);
      
      const equipment_id = Array.isArray(fields.equipment_id) ? fields.equipment_id[0] : fields.equipment_id;
      const serial_number = Array.isArray(fields.serial_number) ? fields.serial_number[0] : fields.serial_number;
      const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
      
      if (!equipment_id || !serial_number) {
        return res.status(400).json({ error: 'Equipment ID and serial number are required' });
      }

      const file = Array.isArray(files.file) ? files.file[0] : files.file;
      
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Verify equipment exists
      const { data: equipment, error: equipmentError } = await supabaseAdmin
        .from('equipment_inventory')
        .select('id, equipment_id, serial_number, name')
        .eq('equipment_id', equipment_id)
        .eq('serial_number', serial_number)
        .single();

      if (equipmentError || !equipment) {
        return res.status(404).json({ error: 'Equipment not found' });
      }

      // Generate unique filename
      const timestamp = Date.now();
      const originalName = file.originalFilename || 'document.pdf';
      const extension = path.extname(originalName);
      const baseName = path.basename(originalName, extension);
      const uniqueFileName = `${equipment_id}_${serial_number}_${timestamp}_${baseName}${extension}`;
      const finalPath = path.join(uploadDir, uniqueFileName);

      // Move file to final location
      fs.renameSync(file.filepath, finalPath);

      // Save attachment record to database
      const { data: attachment, error: attachmentError } = await supabaseAdmin
        .from('equipment_attachments')
        .insert({
          equipment_id: equipment_id,
          serial_number: serial_number,
          file_name: originalName,
          file_type: 'application/pdf',
          file_size: file.size,
          file_path: finalPath,
          uploaded_by: 'user', // You can update this to track actual user
          description: description || null
        })
        .select()
        .single();

      if (attachmentError) {
        console.error('Attachment save error:', attachmentError);
        // Clean up file if database save failed
        fs.unlinkSync(finalPath);
        return res.status(500).json({ error: 'Failed to save attachment record' });
      }

      return res.status(201).json({
        message: 'File uploaded successfully',
        attachment: attachment
      });

    } catch (error) {
      console.error('File upload error:', error);
      return res.status(500).json({ error: 'Failed to upload file' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Attachment ID is required' });
      }

      // Get attachment details before deletion
      const { data: attachment, error: fetchError } = await supabaseAdmin
        .from('equipment_attachments')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !attachment) {
        return res.status(404).json({ error: 'Attachment not found' });
      }

      // Delete from database
      const { error: deleteError } = await supabaseAdmin
        .from('equipment_attachments')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Attachment deletion error:', deleteError);
        return res.status(500).json({ error: 'Failed to delete attachment' });
      }

      // Delete physical file
      try {
        if (fs.existsSync(attachment.file_path)) {
          fs.unlinkSync(attachment.file_path);
        }
      } catch (fileError) {
        console.error('File deletion error:', fileError);
        // Continue even if file deletion fails
      }

      return res.status(200).json({ message: 'Attachment deleted successfully' });
    } catch (error) {
      console.error('Attachment deletion error:', error);
      return res.status(500).json({ error: 'Failed to delete attachment' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 