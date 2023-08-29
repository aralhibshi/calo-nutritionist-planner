import { Prisma, PrismaClient } from '@prisma/client';
import prisma from '@lib/prismaClient';
import { IComponentData, IComponentIngredientData } from '@lib/interfaces';
import { pascalToSnake, convertKeys } from 'src/utils/keyUtils';
import createError from 'http-errors';

export default class ComponentRepository {
  private prisma= prisma;
  private static instance: ComponentRepository | null = null

  private constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  public static getInstance(
  ): ComponentRepository {
    if (!ComponentRepository.instance) {
      ComponentRepository.instance = new ComponentRepository(prisma);
    }
    return ComponentRepository.instance;
  }

  async createComponent(
    data: IComponentData
  ): Promise<any> {
    try {
      console.log('Creating component with data:', JSON.stringify(data, null, 2));

      const result = await this.prisma.component.create({ data });
      const componentId = result.id;

      console.log('Component created successfully');
      return {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-control-Allow-Methods":"POST",
        },
        statusCode: 201,
        body: {
          success: {
            title: 'Success',
            message: 'Component created successfully'
          },
          data: {
            componentId,
            ...result,
          }
        }
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        console.log('Conflict Error:', err);
        throw createError(409, 'Conflict Error', {
          details: 'Component name already exists',
        });
      }

      console.log('Prisma Error:', err);
      throw createError(400, 'Prisma Error', {
        details: 'Error creating component in Prisma',
      });
    }
  }

  async createComponentIngredient(
    data: IComponentIngredientData
  ): Promise<any> {
    try {
      console.log('Creating component ingredient with componentId:', data.componentId, 'and ingredientId:', data.ingredientId);

      const result = await this.prisma.componentIngredient.create({
        data: {
          component: { connect: { id: data.componentId } },
          ingredient: { connect: { id: data.ingredientId } },
          ingredient_quantity: data.ingredientQuantity,
        },
      });

      console.log('Component ingredient created successfully');
      return {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-control-Allow-Methods":"POST",
        },
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
      throw createError(400, 'Prisma Error', {
        details: 'Error creating ComponentIngredient in Prisma',
      });
    }
  }

  async getComponents(
  ): Promise<any> {
    try {
      console.log('Fetching components');
  
      const result = await this.prisma.component.findMany({
        include: {
          ComponentIngredient: {
            include: {
              ingredient: true,
            },
          },
        },
      });
  
      const snakeCaseResults = result.map(item => convertKeys(item, pascalToSnake));
  
      console.log('Components fetched successfully');
      return {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-control-Allow-Methods":"GET",
        },
        statusCode: 200,
        body: JSON.stringify({
          success: {
            title: 'Success',
            message: 'Components fetched successfully',
          },
          data: snakeCaseResults,
        }),
      };
    } catch (err) {
      console.log('Prisma Error:', err);
      throw createError(400, 'Prisma Error', {
        details: 'Error fetching components in Prisma',
      });
    }
  }  

  async searchComponents(
    index: string
  ): Promise<any> {
    try {
      console.log('Fetching matching components with name:', index);
  
      const result = await this.prisma.component.findMany({
        where: {
          name: {
            contains: index,
          },
        },
        orderBy: {
          name: 'asc',
        },
        include: {
          ComponentIngredient: {
            include: {
              ingredient: true
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
  
      console.log('Components fetched successfully');
      return {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-control-Allow-Methods":"GET",
        },
        statusCode: 200,
        body: JSON.stringify({
          success: {
            title: 'Success',
            message: 'Components fetched successfully',
          },
          data: snakeCaseResults,
        })
      };
    } catch (err) {
      console.log('Prisma Error:', err);
      throw createError(400, 'Prisma Error', {
        details: 'Error feetching matcing components in Prisma',
      });
    }
  }

  async removeComponentFromComponentIngredient(
    id: string
  ): Promise<any> {
    try {
      console.log('Removing component from ComponentIngredient');

      const result = await this.prisma.componentIngredient.deleteMany({
        where: {
          component_id: {
            equals: id
          }
        }
      })

      console.log('Component removed from ComponentIngredient successfully');
      return {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-control-Allow-Methods":"DELETE",
        },
        statusCode: 200,
        body: JSON.stringify({
          success: {
            title: 'Success',
            message: 'Component removed from ComponentIngredient successfully',
          },
          data: result
        })
      };
    } catch (err) {
      console.log('Prisma Error:', err);
      throw createError(400, 'Prisma Error', {
        details: 'Error removing component from ComponentIngredient in Prisma',
      });
    }
  }

  async removeComponentFomMealComponent(
    id: string
  ): Promise<any> {
    try {
      console.log('Removing component from MealComponent');

      const result = await this.prisma.mealComponent.deleteMany({
        where: {
          component_id: {
            equals: id
          }
        }
      });

      console.log('Component removed from MealComponent successfully');
      return {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-control-Allow-Methods":"DELETE",
        },
        statusCode: 200,
        body: JSON.stringify({
          success: {
            title: 'Success',
            message: 'Component removed from MealComponent successfully',
          },
          data: result
        })
      };
    } catch (err) {
      console.log('Prisma Error:', err);
      throw createError(400, 'Prisma Error', {
        details: 'Error removing component from MealComponent in Prisma',
      });
    }
  }

  async deleteComponent(
    id: string
  ): Promise<any> {
    try {
      console.log('Deleting component with Id:', id);
  
      const result = await this.prisma.component.delete({
        where: {
          id: id,
        },
      });
  
      console.log('Component deleted successfully');
      return {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-control-Allow-Methods":"DELETE",
        },
        statusCode: 200,
        body: JSON.stringify({
          success: {
            title: 'Success',
            message: 'Component deleted successfully',
          },
          data: result
        })
      };
    } catch (err) {
      console.log('Prisma Error:', err);
      throw createError(400, 'Prisma Error', {
        details: 'Error deleting component from component in Prisma',
      });
    }
  }
}