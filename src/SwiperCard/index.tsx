import React, {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  type PropsWithChildren,
} from 'react';
import { useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { SwiperCardRefType } from 'rn-swiper-list';

import OverlayLabel from './OverlayLabel';

const SwipeableCard = forwardRef<SwiperCardRefType, PropsWithChildren<any>>(
  (
    {
      index,
      activeIndex,
      lastZIndex,
      onSwipeLeft,
      onSwipeRight,
      onSwipeTop,
      onSwipeBottom,
      cardStyle,
      children,
      disableRightSwipe,
      disableLeftSwipe,
      disableTopSwipe,
      disableBottomSwipe,
      translateXRange,
      translateYRange,
      inputOverlayLabelRightOpacityRange,
      outputOverlayLabelRightOpacityRange,
      inputOverlayLabelLeftOpacityRange,
      outputOverlayLabelLeftOpacityRange,
      inputOverlayLabelTopOpacityRange,
      outputOverlayLabelTopOpacityRange,
      inputOverlayLabelBottomOpacityRange,
      outputOverlayLabelBottomOpacityRange,
      OverlayLabelRight,
      OverlayLabelLeft,
      OverlayLabelTop,
      OverlayLabelBottom,
      onSwipeStart,
      onSwipeActive,
      onSwipeEnd,
      swipeBackXSpringConfig,
      swipeBackYSpringConfig,
      swipeTopSpringConfig,
      swipeBottomSpringConfig,
    },
    ref
  ) => {
    const swipeSpringConfig = {
      duration: 400,
    };
    const intValue = 0;
    const translateX = useSharedValue(intValue);
    const translateY = useSharedValue(0);
    const currentActiveIndex = useSharedValue(Math.floor(activeIndex.value));
    const nextActiveIndex = useSharedValue(Math.floor(activeIndex.value));
    const zIndexValue = useSharedValue(-index);

    const { width, height } = useWindowDimensions();
    const maxCardTranslation = width * 1.5;
    const maxCardTranslationY = height * 1.5;

    const swipeRight = useCallback(() => {
      onSwipeRight?.(index);
      zIndexValue.value = lastZIndex.value;
      lastZIndex.value = lastZIndex.value - 1;
      translateX.value = withSpring(
        maxCardTranslation,
        swipeSpringConfig,
        () => {
          translateX.value = 0;
        }
      );
      activeIndex.value++;
    }, [
      index,
      activeIndex,
      maxCardTranslation,
      onSwipeRight,
      translateX,
      swipeSpringConfig,
    ]);

    const swipeLeft = useCallback(() => {
      onSwipeLeft?.(index);
      zIndexValue.value = lastZIndex.value;
      lastZIndex.value = lastZIndex.value - 1;
      translateX.value = withSpring(
        -maxCardTranslation,
        swipeSpringConfig,
        () => {
          translateX.value = 0;
        }
      );
      activeIndex.value++;
    }, [
      index,
      activeIndex,
      maxCardTranslation,
      onSwipeLeft,
      translateX,
      swipeSpringConfig,
    ]);

    const swipeTop = useCallback(() => {
      onSwipeTop?.(index);
      zIndexValue.value = lastZIndex.value;
      lastZIndex.value = lastZIndex.value - 1;
      translateY.value = withSpring(
        -maxCardTranslationY,
        swipeTopSpringConfig,
        () => {
          translateY.value = 0;
        }
      );
      activeIndex.value++;
    }, [
      index,
      activeIndex,
      maxCardTranslationY,
      onSwipeTop,
      translateY,
      swipeTopSpringConfig,
    ]);

    const swipeBottom = useCallback(() => {
      onSwipeBottom?.(index);
      zIndexValue.value = lastZIndex.value;
      lastZIndex.value = lastZIndex.value - 1;
      translateY.value = withSpring(
        maxCardTranslationY,
        swipeBottomSpringConfig,
        () => {
          translateY.value = 0;
        }
      );
      activeIndex.value++;
    }, [
      index,
      activeIndex,
      maxCardTranslationY,
      onSwipeBottom,
      translateY,
      swipeBottomSpringConfig,
    ]);

    const swipeBack = useCallback(() => {
      cancelAnimation(translateX);
      cancelAnimation(translateY);
      translateX.value = withSpring(intValue, swipeBackXSpringConfig);
      translateY.value = withSpring(0, swipeBackYSpringConfig);
    }, [
      translateX,
      translateY,
      swipeBackXSpringConfig,
      swipeBackYSpringConfig,
    ]);

    useImperativeHandle(
      ref,
      () => {
        return {
          swipeLeft,
          swipeRight,
          swipeBack,
          swipeTop,
          swipeBottom,
        };
      },
      [swipeLeft, swipeRight, swipeBack, swipeTop, swipeBottom]
    );

    const inputRangeX = React.useMemo(() => {
      return translateXRange ?? [];
    }, [translateXRange]);
    const inputRangeY = React.useMemo(() => {
      return translateYRange ?? [];
    }, [translateYRange]);

    const activeOffSetXLeft = disableLeftSwipe ? -200 : -10;
    const activeOffSetXRight = disableRightSwipe ? 200 : 10;

    const gesture = Gesture.Pan()
      .activeOffsetX([activeOffSetXLeft, activeOffSetXRight])
      .onBegin(() => {
        currentActiveIndex.value = Math.floor(activeIndex.value);
        if (onSwipeStart) runOnJS(onSwipeStart)();
      })
      .onUpdate((event) => {
        if (currentActiveIndex.value !== index) return;
        if (onSwipeActive) runOnJS(onSwipeActive)();

        if (disableLeftSwipe && event.translationX < 0) return;
        if (disableRightSwipe && event.translationX > 0) return;

        translateX.value = event.translationX;
        translateY.value = event.translationY;

        if (height / 3 < Math.abs(event.translationY)) {
          nextActiveIndex.value = interpolate(
            translateY.value,
            inputRangeY,
            [
              currentActiveIndex.value + 1,
              currentActiveIndex.value,
              currentActiveIndex.value + 1,
            ],
            'clamp'
          );
          return;
        }

        nextActiveIndex.value = interpolate(
          translateX.value,
          inputRangeX,
          [
            currentActiveIndex.value + 1,
            currentActiveIndex.value,
            currentActiveIndex.value + 1,
          ],
          'clamp'
        );
      })
      .onFinalize((event) => {
        if (translateX.value === 0 && translateY.value === 0) return;
        if (currentActiveIndex.value !== index) return;
        if (onSwipeEnd) runOnJS(onSwipeEnd)();
        if (nextActiveIndex.value === activeIndex.value + 1) {
          const sign = Math.sign(event.translationX);
          const signY = Math.sign(event.translationY);
          const signPositionY = Number.isInteger(
            interpolate(
              translateY.value,
              inputRangeY,
              [
                currentActiveIndex.value + 1,
                currentActiveIndex.value,
                currentActiveIndex.value + 1,
              ],
              'clamp'
            )
          );

          if (signPositionY) {
            if (signY === -1 && !disableTopSwipe) {
              runOnJS(swipeTop)();
              return;
            }
            if (signY === 1 && !disableBottomSwipe) {
              runOnJS(swipeBottom)();
              return;
            }
          }

          if (!signPositionY) {
            if (sign === 1 && !disableRightSwipe) {
              runOnJS(swipeRight)();
              return;
            }
            if (sign === -1 && !disableLeftSwipe) {
              runOnJS(swipeLeft)();
              return;
            }
          }
        }
        translateX.value = withSpring(0, swipeBackXSpringConfig);
        translateY.value = withSpring(0, swipeBackYSpringConfig);
      });

    const rCardStyle = useAnimatedStyle(() => {
      return {
        position: 'absolute',
        zIndex: zIndexValue.value,
        transform: [
          {
            translateX: translateX.value,
          },
          // {
          //   translateY: translateY.value,
          // },
        ],
      };
    });

    return (
      <GestureDetector gesture={gesture}>
        <Animated.View style={[cardStyle, rCardStyle]}>
          {OverlayLabelLeft && (
            <OverlayLabel
              inputRange={inputOverlayLabelLeftOpacityRange}
              outputRange={outputOverlayLabelLeftOpacityRange}
              Component={OverlayLabelLeft}
              opacityValue={translateX}
            />
          )}
          {OverlayLabelRight && (
            <OverlayLabel
              inputRange={inputOverlayLabelRightOpacityRange}
              outputRange={outputOverlayLabelRightOpacityRange}
              Component={OverlayLabelRight}
              opacityValue={translateX}
            />
          )}
          {OverlayLabelTop && (
            <OverlayLabel
              inputRange={inputOverlayLabelTopOpacityRange}
              outputRange={outputOverlayLabelTopOpacityRange}
              Component={OverlayLabelTop}
              opacityValue={translateY}
            />
          )}
          {OverlayLabelBottom && (
            <OverlayLabel
              inputRange={inputOverlayLabelBottomOpacityRange}
              outputRange={outputOverlayLabelBottomOpacityRange}
              Component={OverlayLabelBottom}
              opacityValue={translateY}
            />
          )}

          {children}
        </Animated.View>
      </GestureDetector>
    );
  }
);

export default memo(SwipeableCard);
