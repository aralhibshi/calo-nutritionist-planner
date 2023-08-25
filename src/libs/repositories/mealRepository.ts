import { Prisma, PrismaClient } from '@prisma/client';
import prisma from '@lib/prismaClient';
import { IMealData,  IMealComponentData } from '@lib/interfaces';
import { convertKeys, pascalToSnake } from 'src/utils/keyUtils';
import createError from 'http-errors';

export default class MealRepository {
  private prisma= prisma;
  private static instance: MealRepository | null = null

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public static getInstance(
  ): MealRepository {
    if (!MealRepository.instance) {
      MealRepository.instance = new MealRepository(prisma);
    }
    return MealRepository.instance;
  }

  async createMeal(
    data: IMealData
  ): Promise<any> {
    try {
      console.log('Creating Meal with data:', JSON.stringify(data, null, 2));

      const createdMeal = await this.prisma.meal.create({ data });

      console.log('Meal created successfully');

      return {
        statusCode: 201,
        body: {
          success: {
            title: 'Success',
            message: 'Meal created successfully'
          },
          data: createdMeal
        }
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        console.log('Conflict Error:', err);
        throw createError(409, 'Conflict Error', {
          details: 'Meal name already exists',
        });
      }

      console.log('Prisma Error:', err);
      throw createError(400, 'Prisma Error', {
        details: 'Error creating meal in Prisma',
      });
    }
  }

  async getMeals(
  ): Promise<any> {
    try {
      console.log('Fetching meals');
  
      const result = await this.prisma.meal.findMany({
        include: {
          MealComponent: {
            include: {
              component: true
            }
          }
        }
      });

      const snakeCaseResults = result.map(item => convertKeys(item, pascalToSnake));
  
      console.log('Meals fetched successfully');
  
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: {
            title: 'Success',
            message: 'Meals fetched successfully'
          },
          data: snakeCaseResults
        }),
      };
    } catch (err) {
      console.log('Prisma Error:', err)
      throw createError(400, 'Prisma Error', {
        details: 'Error fetching meals in Prisma',
      });
    }
  }

  async searchMeals(
    index: string
  ): Promise<any> {
    try {
      console.log('Fetching meals with name:', index);
  
      const result = await this.prisma.meal.findMany({
        where: {
          name: {
            contains: index,
          },
        },
        orderBy: {
          name: 'asc',
        },
        include: {
          MealComponent: {
            include: {
              component: true
            }
          }
        }
      });
      
      const sortedResults = result.sort((a, b) => {
      if (a.name === index && b.name !== index) {
        return -1;
      } else if (a.name !== index && b.name === index) {
        return 1;
      } else {
        return 0;
      }
      });

      const snakeCaseResults = sortedResults.map(item => convertKeys(item, pascalToSnake));
  
      console.log('Meals fetched successfully');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: {
            title: 'Success',
            message: 'Meals fetched successfully',
          },
          data: snakeCaseResults,
        })
      };
    } catch (err) {
      console.log('Prisma Error', err)
      throw createError(400, 'Prisma Error', {
        details: 'Error fetching matching meals in Prisma',
      });
    }
  }

  async createMealComponent(
    data: IMealComponentData
  ): Promise<any> {
    try {
      console.log('Creating meal component with mealId:', data.mealId, 'and componentId:', data.componentId);
  
      const result = await this.prisma.mealComponent.create({
        data: {
          meal: { connect: { id: data.mealId } },
          component: { connect: { id: data.componentId } },
          component_quantity: data.componentQuantity
        },
      });
  
      console.log('Meal component created successfully');
  
      return {
        statusCode: 201,
        body: JSON.stringify({
          success: {
            title: 'Success',
            message: 'ComponentIngredient created successfully'
          },
          data: result
        })
      };
    } catch (err) {
      console.log('Prisma Error', err)
      throw createError(400, 'Prisma Error', {
        details: 'Error creating ComponentIngredient in Prisma',
      });
    }
  }

  async removeMealFomMealComponent(
    id: string
  ): Promise<any> {
    try {
      console.log('Removing meal from MealComponent');
  
      const result = await this.prisma.mealComponent.deleteMany({
        where: {
          meal_id: {
            equals: id,
          }
        }
      });
  
      console.log('Meal removed from MealComponent successfully');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: {
            title: 'Success',
            message: 'Meal removed from MealComponent successfully',
          }
        }),
        data: result
      };
    } catch (err) {
      console.log('Prisma Error', err)
      throw createError(400, 'Prisma Error', {
        details: 'Error removing meal from MealComponent in Prisma',
      });
    }
  }

  async deleteMeal(
    id: string
  ): Promise<any> {
    try {
      console.log('Deleting meal with Id:', id);
  
      const result = await this.prisma.meal.delete({
        where: {
          id: id,
        },
      });
  
      console.log('Meal deleted successfully');
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: {
            title: 'Success',
            message: 'Meal deleted successfully',
          },
          data: result
        })
      };
    } catch (err) {
      console.log('Prisma Error', err)
      throw createError(400, 'Prisma Error', {
        details: 'Error deleting meal in Prisma',
      });
    }
  }
}