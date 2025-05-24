import React, { useRef, useState } from 'react';
import { View, FlatList, Animated } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import PullToSearchHeader from './PullToSearchHeader';

interface PullToSearchContainerProps {
  children: React.ReactElement<any>;
  onSearch: (query: string) => void;
  placeholder?: string;
  searchValue: string;
  onChangeText: (text: string) => void;
}

export default function PullToSearchContainer({
  children,
  onSearch,
  placeholder,
  searchValue,
  onChangeText
}: PullToSearchContainerProps) {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const panRef = useRef<PanGestureHandler>(null);
  const translateY = useRef(new Animated.Value(0)).current;

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    const { state, translationY, velocityY } = event.nativeEvent;

    if (state === State.END) {
      if (translationY > 60 || velocityY > 500) {
        setIsSearchVisible(true);
      }
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleCancel = () => {
    setIsSearchVisible(false);
    onChangeText('');
  };

  return (
    <View style={{ flex: 1 }}>
      <PullToSearchHeader
        onSearch={onSearch}
        onCancel={handleCancel}
        placeholder={placeholder}
        isVisible={isSearchVisible}
        searchValue={searchValue}
        onChangeText={onChangeText}
      />
      <PanGestureHandler
        ref={panRef}
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        minPointers={1}
        maxPointers={1}
        shouldCancelWhenOutside={false}
        activeOffsetY={10}
        failOffsetY={-10}
      >
        <Animated.View style={{ flex: 1, transform: [{ translateY }] }}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}