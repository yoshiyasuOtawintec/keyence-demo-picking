import { Request, Response } from 'express';
import { getTantoList } from '../services/tantoService';

export async function getTanto(req: Request, res: Response) {
  try {
    const tantoList = await getTantoList();
    res.json(tantoList);
  } catch (error) {
    console.error('Error getting tanto list:', error);
    res.status(500).send('Error fetching tanto data');
  }
}